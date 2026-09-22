"use client";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { buyPowerUpAction, type ActionState } from "@/lib/actions";
import type { PowerUpKind } from "@/lib/constants";
import { formatNumber, toPersianDigits } from "@/lib/dates";
import { sparkle } from "@/lib/effects";
import { EmojiIcon, GemIcon } from "@/components/icons/Icon";

type Item = { kind: PowerUpKind; title: string; description: string; icon: string; price: number; owned: number };

export function ShopClient({ gems, items }: { gems: number; items: Item[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionState>(null);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black">فروشگاه</h1><p className="text-sm text-muted mt-1">با الماس‌هایی که از XP به دست می‌آوری، قدرت‌افزا بخر</p></div>
        <span className="card px-4 py-2 font-black text-[#2DD4BF] flex items-center gap-1"><GemIcon className="h-5 w-5" />{formatNumber(gems)}</span>
      </div>
      {msg && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl px-4 py-2 text-sm font-bold ${msg.error ? "bg-red-50 text-red-600 dark:bg-red-950/40" : "bg-green-50 text-green-700 dark:bg-green-950/40"}`}>{msg.error ?? msg.success}</motion.p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((it, i) => (
          <motion.div key={it.kind} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-3d p-5 flex flex-col items-center text-center">
            <EmojiIcon name={it.icon} className="h-14 w-14 animate-float text-[#2DD4BF]" />
            <h2 className="mt-3 font-black">{it.title}</h2>
            <p className="text-xs text-muted mt-1 flex-1">{it.description}</p>
            <p className="text-xs font-bold mt-2 text-muted">موجودی: {toPersianDigits(it.owned)}</p>
            <button
              type="button"
              disabled={pending || gems < it.price}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                start(async () => {
                  const res = await buyPowerUpAction(it.kind);
                  setMsg(res);
                  if (!res?.error) sparkle((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight);
                });
              }}
              className="btn btn-brand mt-3 w-full text-sm"
            >
              <GemIcon className="h-4 w-4" /> {toPersianDigits(it.price)}
            </button>
          </motion.div>
        ))}
      </div>
      <div className="card p-4 text-sm text-muted">
        <p className="font-black text-[var(--text)] mb-1">چطور الماس بگیرم؟</p>
        <p>به ازای هر ۱۰ امتیاز تجربه، ۱ الماس دریافت می‌کنی. چالش‌های روزانه و درس‌های بی‌نقص سریع‌ترین راه هستند.</p>
      </div>
    </div>
  );
}
