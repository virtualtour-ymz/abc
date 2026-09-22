"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ClientQuestion } from "@/lib/client-types";
import type { SubmittedAnswer } from "@/lib/answer-types";
import { useLessonStore } from "@/store/lessonStore";
import { QuestionHeader, QuestionView, type GradeInfo } from "./QuestionViews";
import { LessonComplete, type CompleteResult } from "./LessonComplete";
import { celebrate, isSoundOn, sounds } from "@/lib/effects";
import { toPersianDigits } from "@/lib/dates";
import { AvatarIcon, BulbIcon, CheckIcon, FolderIcon, FlameIcon, RepeatIcon, SadIcon, TimerIcon, XIcon } from "@/components/icons/Icon";
import { Mascot } from "@/components/mascot/Mascot";

type Props = {
  questions: ClientQuestion[];
  stationId: number | null;
  mode: "normal" | "review" | "quick" | "timed" | "competitive";
  title: string;
  color?: string;
  backHref: string;
  hints?: number;
  soundEnabled?: boolean;
  opponent?: { name: string; avatar: string; accuracy: number } | null;
  timePerQuestion?: number;
};

type AnswerApiResponse = { ok: boolean; correct: boolean; correctOptionId?: number | null; correctAnswerText?: string | null; correctMatches?: Record<number, string> | null };

export function LessonPlayer({ questions, stationId, mode, title, color = "#58cc02", backHref, hints = 0, soundEnabled = true, opponent = null, timePerQuestion = 20 }: Props) {
  const router = useRouter();
  const s = useLessonStore();
  const [ready, setReady] = useState(false);
  const submissionRef = useRef<SubmittedAnswer | null>(null);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [confirmExit, setConfirmExit] = useState(false);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gradeInfo, setGradeInfo] = useState<GradeInfo | null>(null);
  const hintsLeft = Math.max(0, hints - s.hintsUsed);

  // Initialize the session queue exactly once when this player mounts.
  // IMPORTANT: this must NOT re-run when `questions` changes reference —
  // router.refresh() (called after successful completion, a few lines
  // below) causes the parent server component to re-fetch and pass a new
  // `questions` array, which previously re-triggered this effect and reset
  // the whole session back to question 1 right as the results screen was
  // about to show. An empty dependency array (with the eslint-disable,
  // since we intentionally want mount-only behavior) fixes that.
  useEffect(() => {
    s.init(questions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReady = useCallback((r: boolean, submission: SubmittedAnswer | null) => {
    setReady(r);
    submissionRef.current = submission;
  }, []);

  const current = s.queue[s.index];
  const total = s.totalPlanned;
  const answeredUnique = s.answers.length;
  const progress = total ? Math.min(100, ((s.index) / s.queue.length) * 100) : 0;
  const playSound = soundEnabled && isSoundOn();

  const doCheck = useCallback(
    async (skip = false) => {
      if (!current || s.phase !== "answering") return;
      const questionId = current.id;
      const timeMs = Date.now() - s.questionStartedAt;

      if (skip || !submissionRef.current) {
        // "Skip" / timeout: no submission to grade, counts as wrong locally.
        // Still recorded server-side as a graded-wrong attempt would be nice,
        // but with no submission there is nothing to grade — treat as incorrect.
        s.beginGrading();
        setGradeInfo(null);
        s.applyGraded(false);
        if (playSound) sounds.wrong();
        return;
      }

      s.beginGrading();
      try {
        const res = await fetch("/api/lesson/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, answer: submissionRef.current, timeMs }),
        });
        const data = (await res.json()) as AnswerApiResponse;
        const correct = Boolean(data.correct);
        setGradeInfo({ correct, correctOptionId: data.correctOptionId, correctAnswerText: data.correctAnswerText, correctMatches: data.correctMatches });
        s.applyGraded(correct);
        if (playSound) (correct ? sounds.correct : sounds.wrong)();
        if (correct && s.combo + 1 >= 3) celebrate();
        if (opponent && !s.answers.some((a) => a.questionId === questionId)) {
          setOpponentScore((v) => v + (Math.random() < opponent.accuracy ? 1 : 0));
        }
      } catch {
        // Network failure: fail closed (treat as incorrect) rather than
        // silently trusting an unverified local guess.
        setGradeInfo(null);
        s.applyGraded(false);
      }
    },
    [current, s, playSound, opponent],
  );

  // Timer for timed mode
  useEffect(() => {
    if (mode !== "timed" || s.phase !== "answering") return;
    setTimeLeft(timePerQuestion);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          doCheck(true); // timeout: treated as skip
          return 0;
        }
        if (t <= 4 && playSound) sounds.tick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, s.phase, s.index]);

  // Submit on completion
  useEffect(() => {
    if (s.phase !== "complete" || result || submitting) return;
    setSubmitting(true);
    fetch("/api/lesson/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationId,
        mode,
        durationMs: Date.now() - s.startedAt,
        answers: s.answers.map((a) => ({ questionId: a.questionId, timeMs: a.timeMs })),
        hintsUsed: s.hintsUsed,
      }),
    })
      .then((r) => r.json())
      .then((data: CompleteResult) => {
        setResult(data);
        if (playSound) sounds.complete();
        celebrate(true);
        router.refresh();
      })
      .catch(() => setResult({ xpEarned: 0, breakdown: [], total: s.answers.length, correct: s.answers.filter((a) => a.correct).length, perfect: false, doubled: false, streak: 0, streakExtended: false, usedFreeze: false, newBadges: [], league: { key: "bronze", title: "برنز", icon: "🥉", color: "#cd7f32", min: 0 }, totalXp: 0 }))
      .finally(() => setSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase]);

  // Keyboard: Enter to check/continue
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (s.phase === "answering" && ready) doCheck();
      else if (s.phase === "checked") {
        setGradeInfo(null);
        s.next();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [s, ready, doCheck]);

  if (s.phase === "complete") {
    return (
      <LessonComplete
        result={result}
        loading={!result}
        backHref={backHref}
        color={color}
        opponent={opponent ? { ...opponent, score: opponentScore } : null}
        onRetry={() => { setResult(null); s.init(questions); }}
      />
    );
  }

  if (!current) {
    return (
      <div className="grid min-h-dvh place-items-center text-center p-6">
        <div>
          <div className="flex justify-center text-[#2DD4BF]"><FolderIcon className="h-12 w-12" /></div>
          <p className="mt-3 font-black">سؤالی برای این بخش وجود ندارد</p>
          <Link href={backHref} className="btn btn-secondary mt-4">بازگشت</Link>
        </div>
      </div>
    );
  }

  const isRepeat = s.answers.some((a) => a.questionId === current.id) && s.index >= total;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="mx-auto w-full max-w-3xl px-4 pt-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setConfirmExit(true)} className="text-muted hover:opacity-70" aria-label="خروج"><XIcon className="h-6 w-6" /></button>
          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <motion.div className="h-full rounded-full progress-shine" style={{ background: color }} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 90, damping: 20 }} />
          </div>
          {mode === "timed" ? (
            <span className={`inline-flex items-center gap-1 font-black tabular-nums ${timeLeft <= 5 ? "text-[#ff4b4b] animate-pulse" : "text-muted"}`}><TimerIcon className="h-4 w-4" /> {toPersianDigits(timeLeft)}</span>
          ) : s.combo >= 2 ? (
            <motion.span key={s.combo} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 font-black text-orange-500"><FlameIcon className="h-4 w-4" /> {toPersianDigits(s.combo)}</motion.span>
          ) : (
            <span className="text-xs font-bold text-muted">{toPersianDigits(answeredUnique)}/{toPersianDigits(total)}</span>
          )}
        </div>
        {opponent && (
          <div className="mt-2 flex items-center justify-between text-xs font-black">
            <span className="text-[#2DD4BF]">شما: {toPersianDigits(s.answers.filter((a) => a.correct).length)}</span>
            <span className="text-muted">{title}</span>
            <span className="inline-flex items-center gap-1 text-[#ff4b4b]"><AvatarIcon emoji={opponent.avatar} className="h-5 w-5" /> {opponent.name}: {toPersianDigits(opponentScore)}</span>
          </div>
        )}
      </header>

      {/* Question */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={`${current.id}-${s.index}`} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.25 }} className="flex flex-col gap-6">
            {isRepeat && <span className="self-start inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-950/40 px-3 py-1 text-xs font-black text-orange-600"><RepeatIcon className="h-3.5 w-3.5" /> مرور اشتباه قبلی</span>}
            <QuestionHeader q={current} />
            <QuestionView question={current} checked={s.phase === "checked"} onReady={onReady} hintsAvailable={hintsLeft} onUseHint={s.useHint} grade={gradeInfo ?? undefined} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className={`border-t-2 transition-colors ${s.phase === "checked" ? (s.lastCorrect ? "bg-[#d7ffb8] border-[#d7ffb8] dark:bg-[#1e3a1a] dark:border-[#1e3a1a]" : "bg-[#ffdfe0] border-[#ffdfe0] dark:bg-[#3b1d1d] dark:border-[#3b1d1d]") : "border-soft"} safe-bottom`}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {s.phase === "checked" ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-1 items-start gap-3 ${s.lastCorrect ? "text-[#58a700] dark:text-[#79e02f]" : "text-[#ea2b2b] dark:text-[#ff7d7d]"}`}>
              {!s.lastCorrect && (
                <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 14 }} className="shrink-0">
                  <Mascot mood="comfort" className="h-14 w-14 sm:h-16 sm:w-16" />
                </motion.div>
              )}
              <div className="flex-1">
                <p className="text-xl font-black flex items-center gap-2">
                  {s.lastCorrect && <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0f172a]"><CheckIcon className="h-5 w-5" /></span>}
                  {s.lastCorrect ? ["آفرین!", "عالی!", "درسته!", "فوق‌العاده!"][s.combo % 4] : "اشکالی نداره، ادامه بده!"}
                </p>
                {!s.lastCorrect && gradeInfo?.correctOptionId != null && (
                  <p className="mt-1 text-sm font-bold">پاسخ صحیح: {current.options.find((o) => o.id === gradeInfo.correctOptionId)?.text}</p>
                )}
                {current.explanation && <p className="mt-1 flex gap-1.5 text-sm leading-relaxed opacity-90"><BulbIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>{current.explanation}</span></p>}
              </div>
            </motion.div>
          ) : s.phase === "grading" ? (
            <span className="flex-1 text-sm font-bold text-muted">در حال بررسی...</span>
          ) : (
            <button type="button" onClick={() => doCheck(true)} className="hidden sm:inline-flex btn btn-secondary text-sm">رد کردن</button>
          )}
          {s.phase === "checked" ? (
            <button type="button" onClick={() => { setGradeInfo(null); s.next(); }} className={`btn ${s.lastCorrect ? "btn-primary" : "btn-danger"} min-w-40`}>ادامه</button>
          ) : (
            <button type="button" disabled={!ready || s.phase === "grading"} onClick={() => doCheck()} className={`btn min-w-40 ${ready && s.phase !== "grading" ? "btn-primary" : "bg-[var(--border)] text-muted border-[var(--border)]"}`}>
              {s.phase === "grading" ? "..." : "بررسی"}
            </button>
          )}
        </div>
      </footer>

      {/* Exit confirm */}
      <AnimatePresence>
        {confirmExit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setConfirmExit(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="card w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center text-amber-400"><SadIcon className="h-12 w-12" /></div>
              <h3 className="mt-3 text-lg font-black">صبر کن، نرو!</h3>
              <p className="mt-1 text-sm text-muted">اگر الان خارج شوی پیشرفت این درس از دست می‌رود.</p>
              <div className="mt-5 flex flex-col gap-2">
                <button type="button" className="btn btn-primary" onClick={() => setConfirmExit(false)}>ادامه یادگیری</button>
                <Link href={backHref} className="btn btn-ghost text-[#ff4b4b]">خروج</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
