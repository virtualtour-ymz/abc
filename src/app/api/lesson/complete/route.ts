import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { completeSession } from "@/lib/gamification";

export const dynamic = "force-dynamic";

const schema = z.object({
  stationId: z.number().int().nullable(),
  mode: z.string().max(24),
  durationMs: z.number().int().min(0),
  hintsUsed: z.number().int().min(0).optional(),
  // The client may only claim *which* questions it attempted and *when* —
  // whether each was correct is re-derived server-side in completeSession
  // from the attempts already graded by /api/lesson/answer.
  answers: z.array(z.object({ questionId: z.number().int(), timeMs: z.number().int().min(0) })),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await completeSession(user, parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
