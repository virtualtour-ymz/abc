"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ClientQuestion } from "@/lib/client-types";
import type { SubmittedAnswer } from "@/lib/answer-types";
import { BulbIcon, CheckIcon, CoolIcon, HospitalIcon, MemoIcon, SmileIcon, XIcon } from "@/components/icons/Icon";
export { normalizeAnswer } from "@/lib/answer-types";

export type ViewProps = {
  question: ClientQuestion;
  checked: boolean;
  /**
   * Called whenever the user's current selection changes. `submission` is
   * the raw thing they picked/typed — NOT a verdict. The actual correct/
   * incorrect determination happens server-side in gradeAndReveal().
   */
  onReady: (ready: boolean, submission: SubmittedAnswer | null) => void;
  hintsAvailable: number;
  onUseHint: () => void;
};

const TYPE_LABEL: Record<ClientQuestion["type"], string> = {
  multiple_choice: "گزینه صحیح را انتخاب کنید",
  true_false: "درست یا نادرست؟",
  fill_blank: "جای خالی را پر کنید",
  drag_drop: "موارد را با هم جفت کنید",
  flashcard: "فلش‌کارت — پاسخ را حدس بزنید",
  scenario: "سناریوی بالینی",
  image: "تصویر را شناسایی کنید",
};

export function QuestionHeader({ q }: { q: ClientQuestion }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-muted mb-2">{TYPE_LABEL[q.type]}</p>
      {q.type === "scenario" && q.data.scenario && (
        <div className="mb-3 rounded-2xl border-2 border-dashed border-soft bg-soft p-4 text-sm leading-relaxed">
          <HospitalIcon className="ml-1 inline h-4 w-4 text-[#2DD4BF]" /> {q.data.scenario}
        </div>
      )}
      {q.type === "image" && q.data.image && (
        <div className="mb-3 overflow-hidden rounded-2xl border-2 border-soft relative aspect-[16/10] max-w-md">
          <Image src={q.data.image} alt="تصویر سؤال" fill className="object-cover" sizes="(max-width: 768px) 100vw, 448px" priority />
        </div>
      )}
      <h2 className="text-xl lg:text-2xl font-black leading-relaxed">{q.prompt}</h2>
    </div>
  );
}

/* ---------- Choice (MC / TF / scenario / image) ---------- */
export function ChoiceView({ question, checked, onReady, hintsAvailable, onUseHint, correctOptionId }: ViewProps & { correctOptionId?: number | null }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  useEffect(() => {
    setSelected(null);
    setHidden([]);
  }, [question.id]);
  useEffect(() => {
    onReady(selected !== null, selected !== null ? { type: "choice", optionId: selected } : null);
  }, [selected, onReady]);

  const isTF = question.type === "true_false";
  // Hint hides two options client-side as a UX affordance. This does not
  // leak the correct answer (we don't know it client-side either) — it
  // just randomly hides two of the non-selected options.
  const useHint = () => {
    const candidates = question.options.filter((o) => o.id !== selected).map((o) => o.id);
    setHidden(candidates.sort(() => Math.random() - 0.5).slice(0, 2));
    onUseHint();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className={`grid gap-3 ${isTF ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
        {question.options.map((o, i) => {
          const isSel = selected === o.id;
          const isCorrectOpt = checked && correctOptionId != null && o.id === correctOptionId;
          const cls = checked ? (isCorrectOpt ? "correct" : isSel ? "wrong" : "") : isSel ? "selected" : "";
          const isHidden = hidden.includes(o.id);
          return (
            <motion.button
              key={o.id}
              type="button"
              disabled={checked || isHidden}
              onClick={() => setSelected(o.id)}
              whileTap={{ scale: 0.98 }}
              className={`choice flex items-center gap-3 ${cls} ${isHidden ? "opacity-30 line-through" : ""} ${isTF ? "justify-center text-lg py-6" : ""}`}
            >
              {!isTF && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-current text-sm font-black opacity-70">
                  {["۱", "۲", "۳", "۴", "۵"][i]}
                </span>
              )}
              <span className="flex-1 inline-flex items-center gap-2">{isTF && (i === 0 ? <CheckIcon className="h-5 w-5 text-[#58cc02]" /> : <XIcon className="h-5 w-5 text-[#ff4b4b]" />)}{o.text}</span>
            </motion.button>
          );
        })}
      </div>
      {!checked && !isTF && question.options.length >= 4 && hintsAvailable > 0 && hidden.length === 0 && (
        <button type="button" onClick={useHint} className="self-start inline-flex items-center gap-1.5 text-sm font-bold text-amber-500 hover:underline">
          <BulbIcon className="h-4 w-4" /> استفاده از راهنما (حذف ۲ گزینه) — {hintsAvailable} عدد
        </button>
      )}
    </div>
  );
}

/* ---------- Fill in the blank ---------- */
export function FillBlankView({ question, checked, onReady, correctAnswerText, lastCorrect }: ViewProps & { correctAnswerText?: string | null; lastCorrect?: boolean | null }) {
  const [value, setValue] = useState("");
  useEffect(() => setValue(""), [question.id]);
  useEffect(() => {
    onReady(value.trim().length > 0, value.trim().length > 0 ? { type: "text", value } : null);
  }, [value, onReady]);
  const parts = question.prompt.split("____");
  return (
    <div className="flex flex-col gap-4">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={checked}
        autoFocus
        placeholder="پاسخ را بنویسید..."
        className={`w-full rounded-2xl border-2 px-4 py-4 text-lg font-bold outline-none transition bg-soft ${
          checked ? (lastCorrect ? "border-[#58cc02]" : "border-[#ff4b4b]") : "border-soft focus:border-[#2DD4BF]"
        }`}
      />
      {parts.length > 1 && (
        <p className="text-sm text-muted leading-relaxed">
          {parts[0]}
          <span className="mx-1 inline-block min-w-16 border-b-2 border-[#2DD4BF] text-center font-black text-[#2DD4BF]">{value || "…"}</span>
          {parts[1]}
        </p>
      )}
      {checked && correctAnswerText && <p className="text-sm font-bold">پاسخ صحیح: <span className="text-[#58a700]">{correctAnswerText}</span></p>}
    </div>
  );
}

/* ---------- Drag & drop matching (tap-to-match, touch friendly + HTML5 drag) ---------- */
export function MatchView({ question, checked, onReady, correctMatches }: ViewProps & { correctMatches?: Record<number, string> | null }) {
  const lefts = useMemo(() => question.data.pairLefts ?? [], [question.data.pairLefts]);
  const rightTexts = useMemo(() => question.data.pairRights ?? [], [question.data.pairRights]);
  const rights = useMemo(() => rightTexts.map((text, i) => ({ text, i })), [rightTexts]);
  const [selLeft, setSelLeft] = useState<number | null>(null);
  // leftIndex -> the right-side TEXT the user placed there (stable across
  // shuffles since we key by content, not by the shuffled array position)
  const [matches, setMatches] = useState<Record<number, string>>({});
  useEffect(() => {
    setSelLeft(null);
    setMatches({});
  }, [question.id]);

  useEffect(() => {
    const all = Object.keys(matches).length === lefts.length && lefts.length > 0;
    onReady(all, all ? { type: "pairs", matches } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, lefts.length, onReady]);

  const assign = (leftIdx: number, rightText: string) => {
    setMatches((m) => {
      const next = { ...m };
      for (const k of Object.keys(next)) if (next[Number(k)] === rightText) delete next[Number(k)];
      next[leftIdx] = rightText;
      return next;
    });
    setSelLeft(null);
  };
  const usedRights = new Set(Object.values(matches));

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {lefts.map((left, i) => {
          const matched = matches[i] !== undefined;
          const isRowCorrect = checked && correctMatches ? correctMatches[i] === matches[i] : false;
          const cls = checked ? (isRowCorrect ? "correct" : "wrong") : selLeft === i ? "selected" : matched ? "selected opacity-80" : "";
          return (
            <button
              key={i}
              type="button"
              disabled={checked}
              draggable={!checked}
              onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(i)); setSelLeft(i); }}
              onClick={() => setSelLeft(selLeft === i ? null : i)}
              className={`choice text-sm min-h-16 ${cls}`}
            >
              <span className="block">{left}</span>
              {matched && <span className="block text-xs mt-1 opacity-80">⟵ {matches[i]}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        {rights.map((r) => {
          const used = usedRights.has(r.text);
          return (
            <motion.button
              key={r.i}
              type="button"
              disabled={checked || (selLeft === null && !used)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const li = Number(e.dataTransfer.getData("text/plain")); if (!Number.isNaN(li)) assign(li, r.text); }}
              onClick={() => { if (selLeft !== null) assign(selLeft, r.text); }}
              whileTap={{ scale: 0.97 }}
              className={`choice text-sm min-h-16 ${used ? "opacity-50" : selLeft !== null ? "border-[#2DD4BF] border-dashed" : ""}`}
            >
              {r.text}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Flashcard ---------- */
export function FlashcardView({ question, checked, onReady }: ViewProps) {
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState<boolean | null>(null);
  useEffect(() => {
    setFlipped(false);
    setKnew(null);
  }, [question.id]);
  useEffect(() => {
    onReady(knew !== null, knew !== null ? { type: "flashcard", knew } : null);
  }, [knew, onReady]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flip-card cursor-pointer" onClick={() => !checked && setFlipped((f) => !f)}>
        <div className={`flip-inner min-h-56 ${flipped ? "flipped" : ""}`}>
          <div className="flip-face card-3d min-h-56 grid place-items-center p-6 text-center bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] !border-[#0D9488] text-white">
            <div>
              <MemoIcon className="mx-auto mb-3 h-10 w-10 text-white/90" />
              <p className="text-lg font-black leading-relaxed">{question.prompt}</p>
              <p className="mt-4 text-xs opacity-80">برای دیدن پاسخ ضربه بزنید</p>
            </div>
          </div>
          <div className="flip-face flip-back card-3d min-h-56 grid place-items-center p-6 text-center">
            <p className="text-base font-bold leading-relaxed">{question.data.back}</p>
          </div>
        </div>
      </div>
      {flipped && !checked && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setKnew(false)} className={`choice inline-flex items-center justify-center gap-2 ${knew === false ? "wrong" : ""}`}><SmileIcon className="h-5 w-5" /> بلد نبودم</button>
          <button type="button" onClick={() => setKnew(true)} className={`choice inline-flex items-center justify-center gap-2 ${knew === true ? "correct" : ""}`}><CoolIcon className="h-5 w-5" /> بلد بودم</button>
        </motion.div>
      )}
    </div>
  );
}

export type GradeInfo = {
  correct: boolean | null;
  correctOptionId?: number | null;
  correctAnswerText?: string | null;
  correctMatches?: Record<number, string> | null;
};

export function QuestionView(props: ViewProps & { grade?: GradeInfo }) {
  const { grade, ...rest } = props;
  switch (props.question.type) {
    case "fill_blank":
      return <FillBlankView {...rest} correctAnswerText={grade?.correctAnswerText} lastCorrect={grade?.correct} />;
    case "drag_drop":
      return <MatchView {...rest} correctMatches={grade?.correctMatches} />;
    case "flashcard":
      return <FlashcardView {...rest} />;
    default:
      return <ChoiceView {...rest} correctOptionId={grade?.correctOptionId} />;
  }
}
