import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  attempts,
  badges,
  dailyChallenges,
  leaderboardEntries,
  practiceSessions,
  reviewItems,
  stationProgress,
  userBadges,
  users,
  friendships,
  powerUps,
  type User,
} from "@/db/schema";
import { addDays, dateKey, periodKeys } from "@/lib/dates";

export { XP, LEAGUES, leagueForXp, nextLeague, leagueInfo, POWER_UPS } from "@/lib/constants";
export type { League, LeagueKey, PowerUpKind } from "@/lib/constants";
import { XP, leagueForXp } from "@/lib/constants";

// ---------- Streak ----------
export async function touchStreak(user: User): Promise<{ streak: number; extended: boolean; weekly: boolean; usedFreeze: boolean }> {
  const today = dateKey();
  const yesterday = dateKey(addDays(new Date(), -1));
  if (user.lastActiveDate === today) {
    return { streak: user.streak, extended: false, weekly: false, usedFreeze: false };
  }
  let streak = 1;
  let usedFreeze = false;
  if (user.lastActiveDate === yesterday) {
    streak = user.streak + 1;
  } else if (user.lastActiveDate === dateKey(addDays(new Date(), -2))) {
    // Missed exactly one day: try to consume a streak freeze
    const [pu] = await db.select().from(powerUps).where(and(eq(powerUps.userId, user.id), eq(powerUps.kind, "streak_freeze")));
    if (pu && pu.quantity > 0) {
      await db.update(powerUps).set({ quantity: pu.quantity - 1 }).where(eq(powerUps.id, pu.id));
      streak = user.streak + 1;
      usedFreeze = true;
    }
  }
  const longest = Math.max(user.longestStreak, streak);
  await db.update(users).set({ streak, longestStreak: longest, lastActiveDate: today }).where(eq(users.id, user.id));
  return { streak, extended: true, weekly: streak > 0 && streak % 7 === 0, usedFreeze };
}

// ---------- XP & Leaderboard ----------
export async function awardXp(userId: number, amount: number) {
  if (amount <= 0) return;
  const { week, month } = periodKeys(new Date());
  const [u] = await db
    .update(users)
    .set({ xp: sql`${users.xp} + ${amount}`, gems: sql`${users.gems} + ${Math.floor(amount / 10)}` })
    .where(eq(users.id, userId))
    .returning({ xp: users.xp });
  const league = leagueForXp(u.xp).key;
  await db.update(users).set({ league }).where(eq(users.id, userId));
  for (const [periodType, periodKey] of [["week", week], ["month", month]] as const) {
    await db
      .insert(leaderboardEntries)
      .values({ userId, periodType, periodKey, xp: amount })
      .onConflictDoUpdate({
        target: [leaderboardEntries.userId, leaderboardEntries.periodType, leaderboardEntries.periodKey],
        set: { xp: sql`${leaderboardEntries.xp} + ${amount}` },
      });
  }
}

// ---------- Spaced repetition (SM-2 variant) ----------
export async function updateReviewItem(userId: number, questionId: number, correct: boolean, timeMs: number) {
  const [existing] = await db
    .select()
    .from(reviewItems)
    .where(and(eq(reviewItems.userId, userId), eq(reviewItems.questionId, questionId)));

  // quality: 5 quick correct, 4 correct, 3 slow correct, 1 incorrect
  const quality = correct ? (timeMs < XP.QUICK_THRESHOLD_MS ? 5 : timeMs < 20000 ? 4 : 3) : 1;
  let ease = existing?.ease ?? 2.5;
  let reps = existing?.repetitions ?? 0;
  let interval = existing?.intervalDays ?? 0;
  let lapses = existing?.lapses ?? 0;

  if (quality < 3) {
    reps = 0;
    interval = 0.007; // ~10 minutes: show again in this or next session
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease * 10) / 10;
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }
  const dueAt = new Date(Date.now() + interval * 86400000);
  await db
    .insert(reviewItems)
    .values({ userId, questionId, ease, repetitions: reps, intervalDays: interval, lapses, dueAt, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [reviewItems.userId, reviewItems.questionId],
      set: { ease, repetitions: reps, intervalDays: interval, lapses, dueAt, updatedAt: new Date() },
    });
}

export async function getDueReviewQuestionIds(userId: number, limit = 10): Promise<number[]> {
  const rows = await db
    .select({ questionId: reviewItems.questionId })
    .from(reviewItems)
    .where(and(eq(reviewItems.userId, userId), lte(reviewItems.dueAt, new Date())))
    .orderBy(sql`${reviewItems.lapses} desc, ${reviewItems.dueAt} asc`)
    .limit(limit);
  return rows.map((r) => r.questionId);
}

// ---------- Badges ----------
export async function checkBadges(userId: number) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) return [];
  const [sessionsAgg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      perfect: sql<number>`coalesce(sum(case when ${practiceSessions.perfect} then 1 else 0 end),0)::int`,
    })
    .from(practiceSessions)
    .where(eq(practiceSessions.userId, userId));
  const [attemptsAgg] = await db
    .select({
      correct: sql<number>`coalesce(sum(case when ${attempts.correct} then 1 else 0 end),0)::int`,
      quick: sql<number>`coalesce(sum(case when ${attempts.correct} and ${attempts.timeMs} < ${XP.QUICK_THRESHOLD_MS} then 1 else 0 end),0)::int`,
    })
    .from(attempts)
    .where(eq(attempts.userId, userId));
  const [friendsAgg] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(friendships)
    .where(and(eq(friendships.status, "accepted"), sql`(${friendships.requesterId} = ${userId} or ${friendships.addresseeId} = ${userId})`));

  const metrics: Record<string, number> = {
    xp: u.xp,
    streak: u.longestStreak,
    sessions: sessionsAgg.total,
    perfect: sessionsAgg.perfect,
    correct: attemptsAgg.correct,
    quick: attemptsAgg.quick,
    friends: friendsAgg.n,
  };
  const all = await db.select().from(badges);
  const owned = await db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId));
  const ownedSet = new Set(owned.map((o) => o.badgeId));
  const newly = all.filter((b) => !ownedSet.has(b.id) && (metrics[b.metric] ?? 0) >= b.threshold);
  if (newly.length) {
    await db.insert(userBadges).values(newly.map((b) => ({ userId, badgeId: b.id }))).onConflictDoNothing();
  }
  return newly;
}

export async function getBadgeProgress(userId: number) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  const [sessionsAgg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      perfect: sql<number>`coalesce(sum(case when ${practiceSessions.perfect} then 1 else 0 end),0)::int`,
    })
    .from(practiceSessions)
    .where(eq(practiceSessions.userId, userId));
  const [attemptsAgg] = await db
    .select({
      correct: sql<number>`coalesce(sum(case when ${attempts.correct} then 1 else 0 end),0)::int`,
      quick: sql<number>`coalesce(sum(case when ${attempts.correct} and ${attempts.timeMs} < ${XP.QUICK_THRESHOLD_MS} then 1 else 0 end),0)::int`,
    })
    .from(attempts)
    .where(eq(attempts.userId, userId));
  const [friendsAgg] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(friendships)
    .where(and(eq(friendships.status, "accepted"), sql`(${friendships.requesterId} = ${userId} or ${friendships.addresseeId} = ${userId})`));
  const metrics: Record<string, number> = {
    xp: u?.xp ?? 0,
    streak: u?.longestStreak ?? 0,
    sessions: sessionsAgg.total,
    perfect: sessionsAgg.perfect,
    correct: attemptsAgg.correct,
    quick: attemptsAgg.quick,
    friends: friendsAgg.n,
  };
  const all = await db.select().from(badges);
  const owned = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const ownedMap = new Map(owned.map((o) => [o.badgeId, o.earnedAt]));
  return all.map((b) => ({
    ...b,
    earned: ownedMap.has(b.id),
    earnedAt: ownedMap.get(b.id) ?? null,
    current: Math.min(metrics[b.metric] ?? 0, b.threshold),
  }));
}

// ---------- Daily challenges ----------
const CHALLENGE_TEMPLATES = [
  { metric: "questions", target: 20, reward: 30, title: "۲۰ سؤال پاسخ بده", icon: "📝" },
  { metric: "perfect", target: 1, reward: 40, title: "یک درس بدون اشتباه", icon: "💯" },
  { metric: "xp", target: 100, reward: 25, title: "۱۰۰ امتیاز کسب کن", icon: "⭐" },
  { metric: "quick", target: 10, reward: 30, title: "۱۰ پاسخ سریع درست", icon: "⚡" },
] as const;

export function challengeMeta(metric: string) {
  return CHALLENGE_TEMPLATES.find((c) => c.metric === metric) ?? CHALLENGE_TEMPLATES[0];
}

export async function getDailyChallenges(userId: number) {
  const today = dateKey();
  const existing = await db.select().from(dailyChallenges).where(and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today)));
  if (existing.length) return existing;
  // choose 3 templates deterministically per day
  const seed = Number(today.replace(/-/g, "")) + userId;
  const start = seed % CHALLENGE_TEMPLATES.length;
  const chosen = [0, 1, 2].map((i) => CHALLENGE_TEMPLATES[(start + i) % CHALLENGE_TEMPLATES.length]);
  await db
    .insert(dailyChallenges)
    .values(chosen.map((c) => ({ userId, date: today, metric: c.metric, target: c.target, reward: c.reward })))
    .onConflictDoNothing();
  return db.select().from(dailyChallenges).where(and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today)));
}

export async function progressChallenges(userId: number, delta: Partial<Record<"questions" | "perfect" | "xp" | "quick", number>>) {
  const today = dateKey();
  for (const [metric, value] of Object.entries(delta)) {
    if (!value) continue;
    await db
      .update(dailyChallenges)
      .set({ progress: sql`least(${dailyChallenges.target}, ${dailyChallenges.progress} + ${value})` })
      .where(and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, today), eq(dailyChallenges.metric, metric)));
  }
}

// ---------- Session completion ----------
export type AnswerResult = { questionId: number; correct: boolean; timeMs: number };
// What the client is allowed to claim: which questions were part of the
// session and roughly when. Whether each was "correct" is never trusted —
// it is re-derived server-side from the attempts this same user already
// submitted (and was graded) via /api/lesson/answer.
export type SessionAnswerClaim = { questionId: number; timeMs: number };

export async function completeSession(
  user: User,
  input: { stationId: number | null; mode: string; answers: SessionAnswerClaim[]; durationMs: number; hintsUsed?: number },
) {
  // Re-derive ground truth from the attempts table: for each claimed
  // questionId, take this user's most recent attempt at it. Any questionId
  // with no matching attempt is dropped rather than trusted as "correct".
  const questionIds = input.answers.map((a) => a.questionId);
  const recentAttempts = questionIds.length
    ? await db
        .select()
        .from(attempts)
        .where(and(eq(attempts.userId, user.id), inArray(attempts.questionId, questionIds)))
    : [];
  const latestByQuestion = new Map<number, (typeof recentAttempts)[number]>();
  for (const a of recentAttempts) {
    const existing = latestByQuestion.get(a.questionId);
    if (!existing || a.createdAt > existing.createdAt) latestByQuestion.set(a.questionId, a);
  }
  const verifiedAnswers: AnswerResult[] = input.answers
    .map((claim) => {
      const record = latestByQuestion.get(claim.questionId);
      if (!record) return null;
      // Use the server-recorded timeMs (captured at grading time), not the
      // client's claim — otherwise a user could falsely claim "quick answer"
      // bonuses without actually answering fast.
      return { questionId: claim.questionId, correct: record.correct, timeMs: record.timeMs };
    })
    .filter((a): a is AnswerResult => a !== null);

  const total = verifiedAnswers.length;
  const correctCount = verifiedAnswers.filter((a) => a.correct).length;
  const quickCount = verifiedAnswers.filter((a) => a.correct && a.timeMs < XP.QUICK_THRESHOLD_MS).length;
  const perfect = total > 0 && correctCount === total;

  const streakRes = await touchStreak(user);

  const breakdown: { label: string; xp: number; icon: string }[] = [];
  let xpTotal = correctCount * XP.CORRECT;
  breakdown.push({ label: "پاسخ‌های درست", xp: correctCount * XP.CORRECT, icon: "✅" });
  if (quickCount) {
    xpTotal += quickCount * XP.QUICK_BONUS;
    breakdown.push({ label: "پاسخ سریع", xp: quickCount * XP.QUICK_BONUS, icon: "⚡" });
  }
  if (perfect) {
    xpTotal += XP.PERFECT_LESSON;
    breakdown.push({ label: "درس بدون اشتباه", xp: XP.PERFECT_LESSON, icon: "💯" });
  }
  if (streakRes.extended) {
    xpTotal += XP.STREAK_DAY;
    breakdown.push({ label: "استریک روزانه", xp: XP.STREAK_DAY, icon: "🔥" });
  }
  if (streakRes.weekly) {
    xpTotal += XP.WEEKLY_BONUS;
    breakdown.push({ label: "پاداش هفته کامل", xp: XP.WEEKLY_BONUS, icon: "🏅" });
  }
  if (input.hintsUsed && input.hintsUsed > 0) {
    await db
      .update(powerUps)
      .set({ quantity: sql`greatest(0, ${powerUps.quantity} - ${input.hintsUsed})` })
      .where(and(eq(powerUps.userId, user.id), eq(powerUps.kind, "hint")));
  }
  // double XP power-up
  const [dbl] = await db.select().from(powerUps).where(and(eq(powerUps.userId, user.id), eq(powerUps.kind, "double_xp")));
  let doubled = false;
  if (dbl && dbl.quantity > 0 && total > 0) {
    await db.update(powerUps).set({ quantity: dbl.quantity - 1 }).where(eq(powerUps.id, dbl.id));
    breakdown.push({ label: "XP دوبرابر", xp: xpTotal, icon: "✨" });
    xpTotal *= 2;
    doubled = true;
  }

  await db.insert(practiceSessions).values({
    userId: user.id,
    stationId: input.stationId,
    mode: input.mode,
    total,
    correct: correctCount,
    xpEarned: xpTotal,
    perfect,
    durationMs: input.durationMs,
  });

  if (input.stationId) {
    const score = total ? Math.round((correctCount / total) * 100) : 0;
    const crowns = score >= 100 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
    await db
      .insert(stationProgress)
      .values({ userId: user.id, stationId: input.stationId, completed: score >= 60, crowns, bestScore: score, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [stationProgress.userId, stationProgress.stationId],
        set: {
          completed: sql`${stationProgress.completed} or ${score >= 60}`,
          crowns: sql`greatest(${stationProgress.crowns}, ${crowns})`,
          bestScore: sql`greatest(${stationProgress.bestScore}, ${score})`,
          updatedAt: new Date(),
        },
      });
  }

  await awardXp(user.id, xpTotal);
  await progressChallenges(user.id, { questions: total, perfect: perfect ? 1 : 0, xp: xpTotal, quick: quickCount });
  const newBadges = await checkBadges(user.id);
  const [fresh] = await db.select().from(users).where(eq(users.id, user.id));

  return {
    xpEarned: xpTotal,
    breakdown,
    total,
    correct: correctCount,
    perfect,
    doubled,
    streak: streakRes.streak,
    streakExtended: streakRes.extended,
    usedFreeze: streakRes.usedFreeze,
    newBadges,
    league: leagueForXp(fresh.xp),
    totalXp: fresh.xp,
  };
}

// ---------- Stats helpers ----------
export async function getTodayStats(userId: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({
      questions: sql<number>`count(*)::int`,
      correct: sql<number>`coalesce(sum(case when ${attempts.correct} then 1 else 0 end),0)::int`,
    })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), gte(attempts.createdAt, start)));
  const [xpRow] = await db
    .select({ xp: sql<number>`coalesce(sum(${practiceSessions.xpEarned}),0)::int` })
    .from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), gte(practiceSessions.completedAt, start)));
  return { questions: row.questions, correct: row.correct, xp: xpRow.xp };
}

export async function getStationProgressMap(userId: number, stationIds?: number[]) {
  const where = stationIds?.length
    ? and(eq(stationProgress.userId, userId), inArray(stationProgress.stationId, stationIds))
    : eq(stationProgress.userId, userId);
  const rows = await db.select().from(stationProgress).where(where);
  return new Map(rows.map((r) => [r.stationId, r]));
}
