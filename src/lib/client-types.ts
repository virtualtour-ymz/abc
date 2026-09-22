/**
 * Pure client-safe types describing a question as sent to the browser.
 * This file must NEVER import from "@/db" or "@/db/schema" — it is
 * imported by client components, and any accidental pull of the `pg`
 * driver (which needs Node core modules: fs/net/tls/dns) breaks the
 * browser build.
 *
 * The server-side query functions that build these (getStationQuestions,
 * getRandomQuestions, etc.) live in "@/lib/content" and import this file
 * for the shared shape — not the other way around.
 */

export type QuestionType = "multiple_choice" | "true_false" | "scenario" | "image" | "fill_blank" | "drag_drop" | "flashcard";

export type ClientOption = { id: number; text: string };

export type ClientQuestion = {
  id: number;
  stationId: number;
  type: QuestionType;
  prompt: string;
  explanation: string;
  difficulty: number;
  data: {
    // NOTE: correct answers/pairs are intentionally NOT sent to the client.
    // fill_blank correctness and drag_drop matching are graded server-side.
    back?: string;
    scenario?: string;
    image?: string;
    pairLefts?: string[]; // drag_drop left-side prompts, in original order (index = correct match index)
    pairRights?: string[]; // drag_drop right-side options, shuffled
  };
  options: ClientOption[];
};
