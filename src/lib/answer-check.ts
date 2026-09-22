/**
 * Server-only grading logic. This file imports "@/db" (which pulls in the
 * `pg` driver and Node core modules like fs/net/tls/dns) and must ONLY be
 * imported from server code — API routes, server actions, or server
 * components. NEVER import this from a "use client" component; import
 * from "@/lib/answer-types" instead for types and normalizeAnswer.
 */
import { db } from "@/db";
import { questionOptions, questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizeAnswer, type SubmittedAnswer, type RevealInfo } from "@/lib/answer-types";

export type { SubmittedAnswer, RevealInfo };
export { normalizeAnswer };

/**
 * Authoritative server-side grading. Compares the user's submission against
 * the correct data already loaded from the DB. Never trusts a "correct"
 * flag coming from the client.
 */
function grade(question: typeof questions.$inferSelect, options: (typeof questionOptions.$inferSelect)[], submitted: SubmittedAnswer): boolean {
  switch (question.type) {
    case "multiple_choice":
    case "true_false":
    case "scenario":
    case "image": {
      if (submitted.type !== "choice") return false;
      const opt = options.find((o) => o.id === submitted.optionId);
      return Boolean(opt?.isCorrect);
    }
    case "fill_blank": {
      if (submitted.type !== "text") return false;
      const data = (question.data ?? {}) as { answers?: string[] };
      const accepted = (data.answers ?? []).map(normalizeAnswer);
      const v = normalizeAnswer(submitted.value);
      return accepted.some((a) => a === v || (a.length > 3 && v.includes(a)));
    }
    case "drag_drop": {
      if (submitted.type !== "pairs") return false;
      const data = (question.data ?? {}) as { pairs?: { left: string; right: string }[] };
      const pairs = data.pairs ?? [];
      if (!pairs.length) return false;
      // Compare by the right-hand TEXT the user matched, not by index —
      // the client only ever sees a shuffled list of right-hand texts and
      // has no stable index into the original (unshuffled) pairs array.
      return pairs.every((p, i) => submitted.matches[i] === p.right);
    }
    case "flashcard": {
      // Self-assessed; the "answer" is the user's own honesty signal.
      // We still record it server-side but it cannot be "wrong" in the
      // adversarial sense — there is no hidden correct value to leak or fake
      // that would give unfair XP beyond what the user already self-reports.
      if (submitted.type !== "flashcard") return false;
      return submitted.knew === true;
    }
    default:
      return false;
  }
}

function reveal(question: typeof questions.$inferSelect, options: (typeof questionOptions.$inferSelect)[]): RevealInfo {
  switch (question.type) {
    case "multiple_choice":
    case "true_false":
    case "scenario":
    case "image": {
      const correct = options.find((o) => o.isCorrect);
      return { correctOptionId: correct?.id ?? null };
    }
    case "fill_blank": {
      const data = (question.data ?? {}) as { answers?: string[] };
      return { correctAnswerText: data.answers?.[0] ?? null };
    }
    case "drag_drop": {
      const data = (question.data ?? {}) as { pairs?: { left: string; right: string }[] };
      const pairs = data.pairs ?? [];
      return { correctMatches: Object.fromEntries(pairs.map((p, i) => [i, p.right])) };
    }
    default:
      return {};
  }
}

/**
 * Single source of truth for grading a submitted answer: loads the question
 * once, grades it, and returns both the verdict and the reveal info (safe
 * to show only because grading has already happened by this point).
 */
export async function gradeAndReveal(questionId: number, submitted: SubmittedAnswer): Promise<{ correct: boolean } & RevealInfo> {
  const [question] = await db.select().from(questions).where(eq(questions.id, questionId));
  if (!question) return { correct: false };
  const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, questionId));
  const correct = grade(question, options, submitted);
  return { correct, ...reveal(question, options) };
}
