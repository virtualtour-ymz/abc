"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toPersianDigits } from "@/lib/dates";
import { MuscleIcon, TargetIcon } from "@/components/icons/Icon";

export function ProfileCharts({ series, catStats }: { series: { label: string; xp: number; sessions: number }[]; catStats: { name: string; color: string; accuracy: number; total: number }[] }) {
  const strengths = catStats.filter((c) => c.accuracy >= 70);
  const weaknesses = catStats.filter((c) => c.accuracy < 70);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-4">
        <h3 className="font-black mb-2">امتیاز ۱۴ روز اخیر</h3>
        <div className="h-48" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => toPersianDigits(v)} />
              <Tooltip cursor={{ fill: "var(--bg-soft)" }} contentStyle={{ borderRadius: 12, border: "2px solid var(--border)", background: "var(--card)", fontFamily: "inherit", direction: "rtl" }} formatter={(v) => [`${toPersianDigits(Number(v))} XP`, "امتیاز"]} />
              <Bar dataKey="xp" radius={[6, 6, 0, 0]} fill="#14B8A6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="card p-4">
        <h3 className="font-black mb-2">دقت بر اساس رشته</h3>
        {catStats.length === 0 ? (
          <p className="text-sm text-muted py-10 text-center">هنوز داده‌ای وجود ندارد</p>
        ) : (
          <div className="h-48" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catStats} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "var(--text)" }} axisLine={false} tickLine={false} orientation="right" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid var(--border)", background: "var(--card)", fontFamily: "inherit", direction: "rtl" }} formatter={(v) => [`${toPersianDigits(Number(v))}٪`, "دقت"]} />
                <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                  {catStats.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-green-50 dark:bg-green-950/30 p-2">
            <p className="font-black text-[#58a700] inline-flex items-center gap-1"><MuscleIcon className="h-4 w-4" /> نقاط قوت</p>
            <p className="text-muted mt-1">{strengths.length ? strengths.map((s) => s.name).join("، ") : "—"}</p>
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-2">
            <p className="font-black text-[#ea2b2b] inline-flex items-center gap-1"><TargetIcon className="h-4 w-4" /> نیاز به تمرین</p>
            <p className="text-muted mt-1">{weaknesses.length ? weaknesses.map((s) => s.name).join("، ") : "—"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
