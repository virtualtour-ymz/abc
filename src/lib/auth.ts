import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { authSessions, users, type User } from "@/db/schema";
import { generateToken } from "@/lib/password";
import { ensureSeeded } from "@/db/seed";

export const SESSION_COOKIE = "nurse_session";
const SESSION_DAYS = 30;

export async function createSession(userId: number) {
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(authSessions).values({ userId, token, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(authSessions).where(eq(authSessions.token, token));
  }
  store.delete(SESSION_COOKIE);
}

/** Returns the current user or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  await ensureSeeded();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(eq(authSessions.token, token), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function publicUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    xp: u.xp,
    gems: u.gems,
    streak: u.streak,
    longestStreak: u.longestStreak,
    dailyGoal: u.dailyGoal,
    league: u.league,
    theme: u.theme,
    soundEnabled: u.soundEnabled,
    notificationsEnabled: u.notificationsEnabled,
    lastActiveDate: u.lastActiveDate,
    createdAt: u.createdAt,
  };
}
export type PublicUser = ReturnType<typeof publicUser>;
