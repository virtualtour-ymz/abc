"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toPersianDigits } from "@/lib/dates";
import { CheckIcon, CrownIcon, EmojiIcon, LockIcon } from "@/components/icons/Icon";

type StationNode = {
  id: number;
  title: string;
  icon: string;
  questionCount: number;
  completed: boolean;
  crowns: number;
  bestScore: number;
  unlocked: boolean;
};
type TopicUnit = { id: number; title: string; description: string; stations: StationNode[] };

const OFFSETS = [0, 44, 70, 44, 0, -44, -70, -44];

export function LearningPath({ topics, color }: { topics: TopicUnit[]; color: string }) {
  const [open, setOpen] = useState<number | null>(null);
  let globalIndex = 0;
  let currentFound = false;

  return (
    <div className="flex flex-col gap-10 pb-10">
      {topics.map((topic, ti) => (
        <section key={topic.id}>
          <div className="rounded-2xl border-2 border-soft p-4 flex items-center justify-between bg-soft">
            <div>
              <p className="text-xs font-bold text-muted">مبحث {toPersianDigits(ti + 1)}</p>
              <h2 className="text-lg font-black">{topic.title}</h2>
              {topic.description && <p className="text-xs text-muted mt-0.5">{topic.description}</p>}
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full text-white" style={{ background: color }}>
              {toPersianDigits(topic.stations.filter((s) => s.completed).length)}/{toPersianDigits(topic.stations.length)}
            </span>
          </div>

          <div className="relative mt-6 flex flex-col items-center gap-6">
            {topic.stations.map((s) => {
              const idx = globalIndex++;
              const offset = OFFSETS[idx % OFFSETS.length];
              const isCurrent = !currentFound && s.unlocked && !s.completed;
              if (isCurrent) currentFound = true;
              const bg = s.completed ? "#58cc02" : s.unlocked ? color : "#29384d";
              const border = s.completed ? "#46a302" : s.unlocked ? shade(color) : "#1e293b";
              const isOpen = open === s.id;
              return (
                <div key={s.id} className="relative" style={{ transform: `translateX(${offset}px)` }}>
                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: [0, -6, 0] }}
                      transition={{ y: { repeat: Infinity, duration: 1.4 } }}
                      className="absolute -top-11 left-1/2 -translate-x-1/2 rounded-xl border-2 border-soft bg-[var(--card)] px-3 py-1.5 text-xs font-black uppercase whitespace-nowrap shadow"
                      style={{ color }}
                    >
                      شروع
                      <span className="absolute left-1/2 -bottom-2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-soft bg-[var(--card)]" />
                    </motion.div>
                  )}
                  <button
                    type="button"
                    disabled={!s.unlocked}
                    onClick={() => setOpen(isOpen ? null : s.id)}
                    className="node-btn"
                    style={{ background: bg, borderColor: border, boxShadow: isCurrent ? `0 0 0 6px ${color}33` : undefined }}
                    aria-label={s.title}
                  >
                    {s.completed ? <CheckIcon className="h-8 w-8 text-white" /> : s.unlocked ? <EmojiIcon name={s.icon} className="h-8 w-8 text-white" /> : <LockIcon className={`h-7 w-7 text-muted ${s.unlocked ? "" : "opacity-60"}`} />}
                    {s.completed && (
                      <span className="absolute -bottom-3 flex gap-0.5 text-xs">
                        {[0, 1, 2].map((i) => (
                          <CrownIcon key={i} className={`h-4 w-4 ${i < s.crowns ? "text-amber-400" : "text-muted opacity-40"}`} />
                        ))}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className="absolute top-full mt-4 left-1/2 -translate-x-1/2 z-30 w-72 rounded-2xl p-4 text-white shadow-2xl"
                        style={{ background: s.completed ? "#58cc02" : color, transform: `translateX(calc(-50% - ${offset}px))` }}
                      >
                        <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45" style={{ background: s.completed ? "#58cc02" : color, marginLeft: offset }} />
                        <h3 className="font-black text-lg inline-flex items-center gap-1.5"><EmojiIcon name={s.icon} className="h-5 w-5" /> {s.title}</h3>
                        <p className="text-xs opacity-90 mt-1">
                          {toPersianDigits(s.questionCount)} سؤال
                          {s.completed && ` • بهترین نمره ${toPersianDigits(s.bestScore)}٪`}
                        </p>
                        <Link
                          href={`/lesson/${s.id}`}
                          className="mt-3 flex items-center justify-center rounded-2xl bg-white py-3 font-black uppercase border-b-4 border-black/15 active:border-b-0 active:translate-y-1 transition-all"
                          style={{ color: s.completed ? "#58cc02" : color }}
                        >
                          {s.completed ? "تمرین دوباره +۵ XP" : "شروع +۱۰ XP"}
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function shade(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 40);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.max(0, (n & 255) - 40);
  return `rgb(${r},${g},${b})`;
}
