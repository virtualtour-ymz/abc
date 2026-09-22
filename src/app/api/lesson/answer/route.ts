import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { updateReviewItem } from "@/lib/gamification";
import { gradeAndReveal, type SubmittedAnswer } from "@/lib/answer-check";

export const dynamic = "force-dynamic";

const submittedSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("choice"), optionId: z.number().int() }),
  z.object({ type: z.literal("text"), value: z.string().max(500) }),
  z.object({ type: z.literal("pairs"), matches: z.record(z.string(), z.string().max(500)) }),
  z.object({ type: z.literal("flashcard"), knew: z.boolean() }),
]);

const schema = z.object({
  questionId: z.number().int(),
  answer: submittedSchema,
  timeMs: z.number().int().min(0),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { questionId, answer, timeMs } = parsed.data;

  // "matches" arrives with string keys (JSON object keys are always strings);
  // convert back to numeric leftIndex -> rightIndex before grading.
  const submitted: SubmittedAnswer =
    answer.type === "pairs"
      ? { type: "pairs", matches: Object.fromEntries(Object.entries(answer.matches).map(([k, v]) => [Number(k), v])) }
      : answer;

  // Grading and reveal-info both happen from the same DB read, and reveal
  // info is only meaningful because grading has already committed the
  // user's answer server-side — it can no longer be used to cheat on this
  // specific question.
  const { correct, ...reveal } = await gradeAndReveal(questionId, submitted);

  await db.insert(attempts).values({ userId: user.id, questionId, correct, timeMs });
  await updateReviewItem(user.id, questionId, correct, timeMs);
  return NextResponse.json({ ok: true, correct, ...reveal });
}
