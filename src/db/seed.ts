import { db } from "@/db";
import {
  badges,
  categories,
  questionOptions,
  questions,
  stations,
  topics,
  users,
  leaderboardEntries,
  friendships,
  userBadges,
} from "@/db/schema";
import { BADGES, CONTENT, type SeedQuestion } from "@/db/seed-content";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { periodKeys } from "@/lib/dates";

const TYPE_MAP = {
  mc: "multiple_choice",
  tf: "true_false",
  fb: "fill_blank",
  dd: "drag_drop",
  fc: "flashcard",
  sc: "scenario",
  img: "image",
} as const;

function questionPayload(q: SeedQuestion) {
  switch (q.t) {
    case "fb":
      return { answers: q.a };
    case "dd":
      return { pairs: q.pairs.map(([left, right]) => ({ left, right })) };
    case "fc":
      return { back: q.back };
    case "sc":
      return { scenario: q.scenario };
    case "img":
      return { image: q.img };
    default:
      return {};
  }
}

export async function seedContent() {
  for (const [ci, cat] of CONTENT.entries()) {
    const [c] = await db
      .insert(categories)
      .values({ slug: cat.slug, title: cat.title, description: cat.description, color: cat.color, icon: cat.icon, order: ci })
      .onConflictDoUpdate({ target: categories.slug, set: { title: cat.title, description: cat.description, color: cat.color, icon: cat.icon, order: ci } })
      .returning();
    for (const [ti, topic] of cat.topics.entries()) {
      const [t] = await db.insert(topics).values({ categoryId: c.id, title: topic.title, description: topic.desc ?? "", order: ti }).returning();
      for (const [si, station] of topic.stations.entries()) {
        const [s] = await db
          .insert(stations)
          .values({ topicId: t.id, title: station.title, description: station.desc ?? "", icon: station.icon ?? "⭐", order: si })
          .returning();
        for (const [qi, q] of station.questions.entries()) {
          const [qq] = await db
            .insert(questions)
            .values({
              stationId: s.id,
              type: TYPE_MAP[q.t],
              prompt: q.q,
              data: questionPayload(q),
              explanation: "e" in q ? (q.e ?? "") : "",
              difficulty: q.d ?? 1,
              tags: [cat.slug, topic.title],
              order: qi,
            })
            .returning();
          if (q.t === "mc" || q.t === "sc" || q.t === "img") {
            await db.insert(questionOptions).values(q.o.map((text, i) => ({ questionId: qq.id, text, isCorrect: i === q.a, order: i })));
          } else if (q.t === "tf") {
            await db.insert(questionOptions).values([
              { questionId: qq.id, text: "درست", isCorrect: q.a === true, order: 0 },
              { questionId: qq.id, text: "نادرست", isCorrect: q.a === false, order: 1 },
            ]);
          }
        }
      }
    }
  }
  for (const b of BADGES) {
    await db.insert(badges).values(b).onConflictDoUpdate({ target: badges.slug, set: b });
  }
}

const DEMO_USERS = [
  { name: "سارا محمدی", email: "sara@example.com", avatar: "👩‍⚕️", xp: 1840, streak: 12, longestStreak: 21, league: "gold" },
  { name: "علی رضایی", email: "ali@example.com", avatar: "👨‍⚕️", xp: 1320, streak: 5, longestStreak: 9, league: "silver" },
  { name: "مریم احمدی", email: "maryam@example.com", avatar: "🧕", xp: 2650, streak: 30, longestStreak: 30, league: "diamond" },
  { name: "رضا کریمی", email: "reza@example.com", avatar: "🧑‍⚕️", xp: 720, streak: 3, longestStreak: 8, league: "silver" },
  { name: "نرگس حسینی", email: "narges@example.com", avatar: "👩‍🔬", xp: 430, streak: 1, longestStreak: 4, league: "bronze" },
  { name: "امیر موسوی", email: "amir@example.com", avatar: "🧑‍🎓", xp: 980, streak: 7, longestStreak: 15, league: "silver" },
  { name: "زهرا نوری", email: "zahra@example.com", avatar: "👩‍🏫", xp: 210, streak: 2, longestStreak: 2, league: "bronze" },
];

export async function seedUsers() {
  const passwordHash = await hashPassword("123456");
  const { week, month } = periodKeys(new Date());
  const [admin] = await db
    .insert(users)
    .values({ name: "مدیر سامانه", email: "admin@nursing.ir", passwordHash, avatar: "🩺", role: "admin", xp: 3200, streak: 15, longestStreak: 40, league: "diamond", gems: 500 })
    .onConflictDoNothing()
    .returning();
  const [demo] = await db
    .insert(users)
    .values({ name: "کاربر آزمایشی", email: "demo@nursing.ir", passwordHash, avatar: "🧑‍⚕️", xp: 560, streak: 4, longestStreak: 6, league: "silver", gems: 150 })
    .onConflictDoNothing()
    .returning();
  const ids: number[] = [];
  for (const u of DEMO_USERS) {
    const [row] = await db.insert(users).values({ ...u, passwordHash }).onConflictDoNothing().returning();
    if (row) ids.push(row.id);
  }
  const all = [admin, demo].filter(Boolean).map((u) => u.id).concat(ids);
  for (const id of all) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    const weekly = Math.round(u.xp * 0.25);
    const monthly = Math.round(u.xp * 0.6);
    await db.insert(leaderboardEntries).values([
      { userId: id, periodType: "week", periodKey: week, xp: weekly },
      { userId: id, periodType: "month", periodKey: month, xp: monthly },
    ]).onConflictDoNothing();
  }
  if (demo && ids.length >= 3) {
    await db.insert(friendships).values([
      { requesterId: demo.id, addresseeId: ids[0], status: "accepted" },
      { requesterId: ids[1], addresseeId: demo.id, status: "accepted" },
      { requesterId: ids[2], addresseeId: demo.id, status: "pending" },
    ]).onConflictDoNothing();
    const [firstStep] = await db.select().from(badges).where(eq(badges.slug, "first-step"));
    if (firstStep) await db.insert(userBadges).values({ userId: demo.id, badgeId: firstStep.id }).onConflictDoNothing();
  }
}

let seeding: Promise<void> | null = null;

/** Seeds the database if it is empty. Safe to call from server components. */
export async function ensureSeeded() {
  if (seeding) return seeding;
  seeding = (async () => {
    try {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(categories);
      if (Number(count) === 0) {
        await seedContent();
      }
      const [{ ucount }] = await db.select({ ucount: sql<number>`count(*)::int` }).from(users);
      if (Number(ucount) === 0) {
        await seedUsers();
      }
    } catch (err) {
      console.error("Seed failed", err);
      seeding = null;
    }
  })();
  return seeding;
}
