"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { toPersianDigits } from "@/lib/dates";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmojiIcon } from "@/components/icons/Icon";

type Cat = { id: number; slug: string; title: string; description: string; color: string; icon: string; totalStations: number; completedStations: number; percent: number };

export function CategoryGrid({ categories }: { categories: Cat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c, i) => (
        <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Link
            href={`/learn/${c.slug}`}
            className="card-3d block p-4 transition hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
            style={{ borderColor: c.percent === 100 ? "#58cc02" : undefined }}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-inner" style={{ background: `${c.color}22`, border: `2px solid ${c.color}55` }}>
                <EmojiIcon name={c.icon} className="h-8 w-8" style={{ color: c.color }} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-black leading-tight" style={{ color: c.color }}>{c.title}</h3>
                <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">{c.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold text-muted mb-1">
                <span>{toPersianDigits(c.completedStations)}/{toPersianDigits(c.totalStations)} ایستگاه</span>
                <span style={{ color: c.color }}>{toPersianDigits(c.percent)}٪</span>
              </div>
              <ProgressBar value={c.percent} color={c.color} height={10} />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
