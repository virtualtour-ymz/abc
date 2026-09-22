"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatNumber, toPersianDigits } from "@/lib/dates";
import { AvatarIcon, EmojiIcon, IceIcon, MedalIcon, PartyIcon, RibbonIcon } from "@/components/icons/Icon";
import { Mascot } from "@/components/mascot/Mascot";

export type CompleteResult = {
  xpEarned: number;
  breakdown: { label: string; xp: number; icon: string }[];
  total: number;
  correct: number;
  perfect: boolean;
  doubled: boolean;
  streak: number;
  streakExtended: boolean;
  usedFreeze: boolean;
  newBadges: { id: number; title: string; icon: string; description: string }[];
  league: { key: string; title: string; icon: string; color: string; min: number };
  totalXp: number;
};

function CountUp({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{formatNumber(v)}</>;
}

export function LessonComplete({
  result,
  loading,
  backHref,
  color,
  opponent,
  onRetry,
}: {
  result: CompleteResult | null;
  loading: boolean;
  backHref: string;
  color: string;
  opponent: { name: string; avatar: string; score: number } | null;
  onRetry: () => void;
}) {
  if (loading || !result) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="text-center">
          <div className="flex justify-center text-[#2DD4BF]"><PartyIcon className="h-14 w-14 animate-bounce" /></div>
          <p className="mt-4 font-black text-muted">در حال محاسبه امتیازها...</p>
        </div>
      </div>
    );
  }
  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const won = opponent ? result.correct > opponent.score : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="flex justify-center">
          <Mascot mood="cheer" className="h-36" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 text-3xl font-black" style={{ color }}>
          {result.perfect ? "درس بی‌نقص!" : accuracy >= 60 ? "درس کامل شد!" : "تمرین بیشتر لازم است"}
        </motion.h1>
        {opponent && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-2 font-black text-lg">
            {won ? <span className="inline-flex items-center gap-1"><MedalIcon className="h-5 w-5" /> {opponent.name} را شکست دادی!</span> : won === false ? <span className="inline-flex items-center gap-1.5"><AvatarIcon emoji={opponent.avatar} className="h-6 w-6" /> {opponent.name} برنده شد</span> : "مساوی شد!"}
            <span className="block text-sm text-muted mt-1">{toPersianDigits(result.correct)} — {toPersianDigits(opponent.score)}</span>
          </motion.p>
        )}

        <div className="mt-8 grid w-full grid-cols-3 gap-3">
          {[
            { label: "امتیاز کل", value: <CountUp to={result.xpEarned} />, icon: "⚡", c: "#ffc800" },
            { label: "دقت", value: `${toPersianDigits(accuracy)}٪`, icon: "🎯", c: "#58cc02" },
            { label: "استریک", value: toPersianDigits(result.streak), icon: "🔥", c: "#ff9600" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.12 }} className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: s.c }}>
              <div className="py-1 text-xs font-black uppercase text-white" style={{ background: s.c }}>{s.label}</div>
              <div className="py-3 text-2xl font-black flex items-center justify-center gap-1" style={{ color: s.c }}>
                <EmojiIcon name={s.icon} className="h-5 w-5" />
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 w-full card divide-y-2 divide-[var(--border)] text-sm">
          {result.breakdown.map((b, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }} className="flex items-center justify-between px-4 py-3">
              <span className="font-bold flex items-center gap-2"><EmojiIcon name={b.icon} className="h-4 w-4" />{b.label}</span>
              <span className="font-black text-amber-500">+{toPersianDigits(b.xp)} XP</span>
            </motion.li>
          ))}
          {result.usedFreeze && <li className="px-4 py-3 text-xs font-bold text-[#2DD4BF] inline-flex items-center gap-1.5"><IceIcon className="h-4 w-4" /> محافظ استریک استفاده شد و زنجیره‌ات حفظ شد!</li>}
        </motion.ul>

        {result.newBadges.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }} className="mt-6 w-full rounded-2xl bg-gradient-to-l from-[#14B8A6] to-[#06B6D4] p-4 text-white">
            <p className="font-black inline-flex items-center justify-center gap-2"><RibbonIcon className="h-5 w-5" /> نشان جدید کسب کردی!</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {result.newBadges.map((b) => (
                <div key={b.id} className="rounded-xl bg-white/15 px-4 py-2 animate-pop">
                  <EmojiIcon name={b.icon} className="mx-auto h-8 w-8" />
                  <div className="text-sm font-black">{b.title}</div>
                  <div className="text-[11px] opacity-80">{b.description}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <footer className="border-t-2 border-soft safe-bottom">
        <div className="mx-auto flex w-full max-w-2xl gap-3 px-4 py-4">
          <button type="button" onClick={onRetry} className="btn btn-secondary flex-1">تمرین دوباره</button>
          <Link href={backHref} className="btn btn-primary flex-1">ادامه</Link>
        </div>
      </footer>
    </div>
  );
}
