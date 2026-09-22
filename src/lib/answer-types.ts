/**
 * Pure types + client-safe helpers for answer submission and grading.
 * This file must NEVER import anything from "@/db" or any Node-only
 * module (pg, fs, net, tls, dns, etc.) — it is imported by client
 * components ("use client"), and pulling in a server-only dependency
 * here breaks the browser build (Turbopack/webpack cannot bundle
 * Node core modules used by the pg driver).
 *
 * Server-side grading logic that DOES need the database lives in
 * "@/lib/answer-check" and must only ever be imported from server
 * code (API routes, server actions, server components).
 */

/**
 * Normalizes a Persian/Arabic text answer for forgiving comparison:
 * - strips zero-width/control chars
 * - unifies Arabic ي/ك with Persian ی/ک
 * - unifies Arabic-Indic and Persian digits to plain digits
 * - collapses whitespace, strips Arabic diacritics, lowercases
 *
 * This MUST stay identical on client (for live UI feedback, e.g. showing
 * the user their normalized input) and server (for authoritative grading)
 * — they are kept in sync by importing this same function in both places.
 */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .replace(/[\u200c\u200f\u200e]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s+/g, " ")
    .replace(/[\u064B-\u065F]/g, "")
    .toLowerCase();
}

/**
 * Shape of a submitted answer for each question type. The client only ever
 * sends what the user *picked/typed*, never a boolean verdict — the actual
 * correct/incorrect determination happens server-side in gradeAndReveal().
 */
export type SubmittedAnswer =
  | { type: "choice"; optionId: number } // multiple_choice, true_false, scenario, image
  | { type: "text"; value: string } // fill_blank
  | { type: "pairs"; matches: Record<number, string> } // drag_drop: leftIndex -> the right-side TEXT the user matched it with
  | { type: "flashcard"; knew: boolean }; // flashcard self-assessment (not independently gradable)

export type RevealInfo = {
  correctOptionId?: number | null;
  correctAnswerText?: string | null;
  correctMatches?: Record<number, string> | null;
};
