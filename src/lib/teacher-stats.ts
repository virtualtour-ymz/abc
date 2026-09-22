// Server-only: imports "@/db" directly. Must only be called from server
// components / server actions / API routes — never from a "use client"
// component (see src/lib/answer-check.ts for why this matters).
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { attempts, categories, questions, stationProgress, stations, topics, users } from "@/db/schema";

/**
 * One row per student for the roster table: raw correct/wrong counts and
 * completion counts. No blended "grade" — the teacher wants the raw
 * numbers, not an opinionated formula.
 */
export type StudentRow = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  accuracyPct: number | null; // null when totalAnswered === 0 (avoid 0/0 -> "0%")
  stationsCompleted: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  xp: number;
};

/**
 * Roster of all non-admin users with aggregate stats, for the teacher's
 * overview table. Excludes admin accounts (the teacher/demo account itself)
 * so the list only shows actual students.
 */
export async function getStudentRoster(): Promise<StudentRow[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      xp: users.xp,
      streak: users.streak,
      longestStreak: users.longestStreak,
      lastActiveDate: users.lastActiveDate,
      correctCount: sql<number>`coalesce(sum(case when ${attempts.correct} then 1 else 0 end), 0)::int`,
      wrongCount: sql<number>`coalesce(sum(case when ${attempts.correct} then 0 else 1 end), 0)::int`,
    })
    .from(users)
    .leftJoin(attempts, eq(attempts.userId, users.id))
    .where(eq(users.role, "user"))
    .groupBy(users.id);

  // Completed-station counts fetched separately (a left-join with attempts
  // would multiply station_progress rows per attempt row and inflate counts).
  const completions = await db
    .select({ userId: stationProgress.userId, n: sql<number>`count(*)::int` })
    .from(stationProgress)
    .where(eq(stationProgress.completed, true))
    .groupBy(stationProgress.userId);
  const completionMap = new Map(completions.map((c) => [c.userId, c.n]));

  return rows
    .map((r) => {
      const totalAnswered = r.correctCount + r.wrongCount;
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        avatar: r.avatar,
        correctCount: r.correctCount,
        wrongCount: r.wrongCount,
        totalAnswered,
        accuracyPct: totalAnswered > 0 ? Math.round((r.correctCount / totalAnswered) * 100) : null,
        stationsCompleted: completionMap.get(r.id) ?? 0,
        streak: r.streak,
        longestStreak: r.longestStreak,
        lastActiveDate: r.lastActiveDate,
        xp: r.xp,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fa"));
}

export type TopicBreakdownRow = {
  categoryTitle: string;
  categoryIcon: string;
  categoryColor: string;
  topicId: number;
  topicTitle: string;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  accuracyPct: number | null;
};

export type StudentDetail = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  xp: number;
  streak: number;
  longestStreak: number;
  gems: number;
  league: string;
  byTopic: TopicBreakdownRow[];
};

/**
 * Per-student breakdown by topic — correct/wrong counts for every topic the
 * student has attempted at least one question in. Topics with zero
 * attempts are omitted (nothing meaningful to show).
 */
export async function getStudentDetail(userId: number): Promise<StudentDetail | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;

  const rows = await db
    .select({
      categoryTitle: categories.title,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      topicId: topics.id,
      topicTitle: topics.title,
      correctCount: sql<number>`coalesce(sum(case when ${attempts.correct} then 1 else 0 end), 0)::int`,
      wrongCount: sql<number>`coalesce(sum(case when ${attempts.correct} then 0 else 1 end), 0)::int`,
    })
    .from(attempts)
    .innerJoin(questions, eq(questions.id, attempts.questionId))
    .innerJoin(stations, eq(stations.id, questions.stationId))
    .innerJoin(topics, eq(topics.id, stations.topicId))
    .innerJoin(categories, eq(categories.id, topics.categoryId))
    .where(eq(attempts.userId, userId))
    .groupBy(categories.id, categories.title, categories.icon, categories.color, topics.id, topics.title)
    .orderBy(categories.order, topics.order);

  const byTopic: TopicBreakdownRow[] = rows.map((r) => {
    const totalAnswered = r.correctCount + r.wrongCount;
    return { ...r, totalAnswered, accuracyPct: totalAnswered > 0 ? Math.round((r.correctCount / totalAnswered) * 100) : null };
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    xp: user.xp,
    streak: user.streak,
    longestStreak: user.longestStreak,
    gems: user.gems,
    league: user.league,
    byTopic,
  };
}
