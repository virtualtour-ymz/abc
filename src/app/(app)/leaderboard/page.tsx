import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { leaderboardEntries, users, friendships } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { periodKeys } from "@/lib/dates";
import { LEAGUES, leagueForXp } from "@/lib/gamification";
import { LeaderboardTabs } from "@/components/leaderboard/LeaderboardTabs";

export const metadata = { title: "لیگ" };

// Admin accounts are excluded from every leaderboard view (weekly, monthly,
// all-time, and the total-user count) — they're not real competitors, and
// their (often inflated, QA-driven) XP would distort student rankings.
async function ranking(periodType: "week" | "month", periodKey: string) {
  return db
    .select({ id: users.id, name: users.name, avatar: users.avatar, league: users.league, xp: leaderboardEntries.xp, totalXp: users.xp, streak: users.streak })
    .from(leaderboardEntries)
    .innerJoin(users, eq(leaderboardEntries.userId, users.id))
    .where(and(eq(leaderboardEntries.periodType, periodType), eq(leaderboardEntries.periodKey, periodKey), ne(users.role, "admin")))
    .orderBy(desc(leaderboardEntries.xp))
    .limit(50);
}

export default async function LeaderboardPage() {
  const user = await requireUser();
  const { week, month } = periodKeys(new Date());
  const [weekly, monthly, friendRows] = await Promise.all([
    ranking("week", week),
    ranking("month", month),
    db
      .select({ a: friendships.requesterId, b: friendships.addresseeId })
      .from(friendships)
      .where(and(eq(friendships.status, "accepted"), or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id)))),
  ]);
  const friendIds = new Set<number>([user.id, ...friendRows.map((f) => (f.a === user.id ? f.b : f.a))]);
  const allTime = await db
    .select({ id: users.id, name: users.name, avatar: users.avatar, league: users.league, xp: users.xp, totalXp: users.xp, streak: users.streak })
    .from(users)
    .where(ne(users.role, "admin"))
    .orderBy(desc(users.xp))
    .limit(50);
  const [{ n: totalUsers }] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(ne(users.role, "admin"));
  const myLeague = leagueForXp(user.xp);

  return (
    <LeaderboardTabs
      me={user.id}
      leagues={LEAGUES.map((l) => ({ ...l }))}
      myLeague={myLeague.key}
      totalUsers={totalUsers}
      weekly={weekly}
      monthly={monthly}
      allTime={allTime}
      friendIds={[...friendIds]}
    />
  );
}
