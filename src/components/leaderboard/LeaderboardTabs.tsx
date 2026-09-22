"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatNumber, toPersianDigits } from "@/lib/dates";
import { AvatarIcon, EmojiIcon, FlameIcon } from "@/components/icons/Icon";

type Row = { id: number; name: string; avatar: string; league: string; xp: number; totalXp: number; streak: number };
type League = { key: string; title: string; icon: string; color: string; min: number };

export function LeaderboardTabs({ me, leagues, myLeague, totalUsers, weekly, monthly, allTime, friendIds }: { me: number; leagues: League[]; myLeague: string; totalUsers: number; weekly: Row[]; monthly: Row[]; allTime: Row[]; friendIds: number[] }) {
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [scope, setScope] = useState<"all" | "friends" | "league">("all");
  const base = period === "week" ? weekly : period === "month" ? monthly : allTime;
  const rows = base.filter((r) => (scope === "friends" ? friendIds.includes(r.id) : scope === "league" ? r.league === myLeague : true));
  const myRank = rows.findIndex((r) => r.id === me) + 1;
  const current = leagues.find((l) => l.key === myLeague) ?? leagues[0];

  return (
    <div className="flex flex-col gap-5">
      {/* League shields */}
      <div className="flex items-end justify-center gap-4 py-2">
        {leagues.map((l) => {
          const active = l.key === myLeague;
          const locked = l.min > (allTime.find((r) => r.id === me)?.totalXp ?? 0);
          return (
            <motion.div key={l.key} animate={active ? { y: [0, -8, 0] } : {}} transition={{ repeat: Infinity, duration: 1.8 }} className={`flex flex-col items-center ${active ? "scale-125" : locked ? "opacity-30 grayscale" : "opacity-70"}`}>
              <EmojiIcon name={l.icon} className="h-10 w-10 drop-shadow" />
              <span className="text-[10px] font-black mt-1" style={{ color: l.color }}>{l.title}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-black">لیگ {current.title}</h1>
        <p className="text-sm text-muted mt-1">
          {myRank > 0 ? `رتبه شما: ${toPersianDigits(myRank)} از ${toPersianDigits(rows.length)}` : "هنوز امتیازی در این دوره نداری"} • {toPersianDigits(totalUsers)} کاربر فعال
        </p>
        <p className="text-xs text-muted mt-1">۱۰ نفر برتر هر هفته به لیگ بالاتر صعود می‌کنند</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex rounded-2xl border-2 border-soft p-1 bg-soft">
          {([["week", "هفتگی"], ["month", "ماهانه"], ["all", "کل"]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setPeriod(k)} className={`flex-1 rounded-xl px-4 py-2 text-sm font-black transition ${period === k ? "bg-[var(--card)] text-[#2DD4BF] shadow" : "text-muted"}`}>{label}</button>
          ))}
        </div>
        <div className="flex rounded-2xl border-2 border-soft p-1 bg-soft">
          {([["all", "همه"], ["league", "لیگ من"], ["friends", "دوستان"]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setScope(k)} className={`flex-1 rounded-xl px-4 py-2 text-sm font-black transition ${scope === k ? "bg-[var(--card)] text-[#2DD4BF] shadow" : "text-muted"}`}>{label}</button>
          ))}
        </div>
      </div>

      <ul className="card overflow-hidden divide-y-2 divide-[var(--border)]">
        {rows.length === 0 && <li className="p-8 text-center text-muted font-bold">کسی در این فهرست نیست</li>}
        {rows.map((r, i) => {
          const rank = i + 1;
          const isMe = r.id === me;
          const zone = rank <= 10 ? "promo" : rank > rows.length - 5 && rows.length > 15 ? "demote" : "";
          return (
            <motion.li key={r.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 15) * 0.04 }} className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-[#0F2E2A] dark:bg-[#0F2E2A]" : ""}`}>
              <span className={`w-8 text-center font-black ${rank === 1 ? "text-2xl" : rank <= 3 ? "text-xl" : "text-muted"}`}>
                {rank <= 3 ? <EmojiIcon name={["🥇", "🥈", "🥉"][rank - 1]} className="inline-block h-7 w-7" /> : toPersianDigits(rank)}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-soft border-2 border-soft"><AvatarIcon emoji={r.avatar} className="h-7 w-7" /></span>
              <div className="flex-1 min-w-0">
                <p className="font-black truncate">{r.name} {isMe && <span className="text-xs text-[#2DD4BF]">(شما)</span>}</p>
                <p className="text-xs text-muted inline-flex items-center gap-1"><FlameIcon className="h-3.5 w-3.5 text-orange-500" /> {toPersianDigits(r.streak)} روز • <EmojiIcon name={leagues.find((l) => l.key === r.league)?.icon} className="h-3.5 w-3.5" /></p>
              </div>
              <span className="font-black text-amber-500">{formatNumber(r.xp)} XP</span>
              {zone === "promo" && <span className="text-[#58cc02]" title="ناحیه صعود">▲</span>}
              {zone === "demote" && <span className="text-[#ff4b4b]" title="ناحیه سقوط">▼</span>}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
