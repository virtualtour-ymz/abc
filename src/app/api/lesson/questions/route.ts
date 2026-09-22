import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDueReviewQuestionIds } from "@/lib/gamification";
import { getQuestionsByIds, getRandomQuestions } from "@/lib/content";

export const dynamic = "force-dynamic";

/** ?mode=review|quick|timed&category=slug&limit=10 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "quick";
  const category = url.searchParams.get("category") ?? undefined;
  const limit = Math.min(20, Number(url.searchParams.get("limit") ?? 10));
  if (mode === "review") {
    const ids = await getDueReviewQuestionIds(user.id, limit);
    let qs = await getQuestionsByIds(ids);
    if (qs.length < 5) {
      const extra = await getRandomQuestions(limit - qs.length, category);
      const seen = new Set(qs.map((q) => q.id));
      qs = qs.concat(extra.filter((q) => !seen.has(q.id)));
    }
    return NextResponse.json({ questions: qs, dueCount: ids.length });
  }
  const qs = await getRandomQuestions(limit, category);
  return NextResponse.json({ questions: qs });
}
