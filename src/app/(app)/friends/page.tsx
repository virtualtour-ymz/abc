import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users, messages, userBadges, badges } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { FriendsClient } from "@/components/friends/FriendsClient";

export const metadata = { title: "دوستان" };

export default async function FriendsPage() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(friendships)
    .where(or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id)));
  const otherIds = rows.map((r) => (r.requesterId === user.id ? r.addresseeId : r.requesterId));
  const others = otherIds.length ? await db.select().from(users).where(or(...otherIds.map((id) => eq(users.id, id)))) : [];
  const otherMap = new Map(others.map((u) => [u.id, u]));
  const badgeRows = otherIds.length
    ? await db.select({ userId: userBadges.userId, icon: badges.icon, title: badges.title }).from(userBadges).innerJoin(badges, eq(userBadges.badgeId, badges.id)).where(or(...otherIds.map((id) => eq(userBadges.userId, id))))
    : [];
  const inbox = await db
    .select({ id: messages.id, text: messages.text, read: messages.read, createdAt: messages.createdAt, sender: users.name, avatar: users.avatar })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.receiverId, user.id))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  const toCard = (r: typeof rows[number]) => {
    const oid = r.requesterId === user.id ? r.addresseeId : r.requesterId;
    const o = otherMap.get(oid);
    return o
      ? { friendshipId: r.id, id: o.id, name: o.name, avatar: o.avatar, xp: o.xp, streak: o.streak, league: o.league, badges: badgeRows.filter((b) => b.userId === o.id).slice(0, 4), incoming: r.addresseeId === user.id }
      : null;
  };
  const accepted = rows.filter((r) => r.status === "accepted").map(toCard).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const pending = rows.filter((r) => r.status === "pending").map(toCard).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return <FriendsClient friends={accepted} pending={pending} inbox={inbox.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} myXp={user.xp} />;
}
