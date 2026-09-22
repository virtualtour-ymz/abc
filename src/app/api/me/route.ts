import { NextResponse } from "next/server";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { getTodayStats } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const today = await getTodayStats(user.id);
  return NextResponse.json({ user: publicUser(user), today });
}
