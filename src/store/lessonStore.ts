import { create } from "zustand";
import type { ClientQuestion } from "@/lib/client-types";

export type Phase = "answering" | "grading" | "checked" | "complete";
export type AnswerRecord = { questionId: number; correct: boolean; timeMs: number };

type LessonState = {
  queue: ClientQuestion[];
  index: number;
  phase: Phase;
  lastCorrect: boolean | null;
  answers: AnswerRecord[];
  totalPlanned: number;
  startedAt: number;
  questionStartedAt: number;
  combo: number;
  hintsUsed: number;
  init: (questions: ClientQuestion[]) => void;
  /** Called immediately on submit, before the server has responded. */
  beginGrading: () => void;
  /** Called once the server has authoritatively graded the answer. */
  applyGraded: (correct: boolean) => void;
  next: () => void;
  useHint: () => void;
};

export const useLessonStore = create<LessonState>((set, get) => ({
  queue: [],
  index: 0,
  phase: "answering",
  lastCorrect: null,
  answers: [],
  totalPlanned: 0,
  startedAt: Date.now(),
  questionStartedAt: Date.now(),
  combo: 0,
  hintsUsed: 0,
  init: (questions) =>
    set({
      queue: questions,
      index: 0,
      phase: "answering",
      lastCorrect: null,
      answers: [],
      totalPlanned: questions.length,
      startedAt: Date.now(),
      questionStartedAt: Date.now(),
      combo: 0,
      hintsUsed: 0,
    }),
  beginGrading: () => set({ phase: "grading" }),
  applyGraded: (correct) => {
    const { queue, index, answers, questionStartedAt, combo } = get();
    const q = queue[index];
    const timeMs = Date.now() - questionStartedAt;
    const already = answers.some((a) => a.questionId === q.id);
    // Only the first attempt counts towards the score; re-queued wrong answers are practice
    const newAnswers = already ? answers : [...answers, { questionId: q.id, correct, timeMs }];
    const newQueue = correct ? queue : [...queue, q];
    set({ phase: "checked", lastCorrect: correct, answers: newAnswers, queue: newQueue, combo: correct ? combo + 1 : 0 });
  },
  next: () => {
    const { queue, index } = get();
    if (index + 1 >= queue.length) set({ phase: "complete" });
    else set({ index: index + 1, phase: "answering", lastCorrect: null, questionStartedAt: Date.now() });
  },
  useHint: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),
}));
