import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, practiceSessions, questions, stations, topics, categories, stationProgress } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { addDays, dateKey, formatJalali, formatNumber, toPersianDigits, weekdayShort, relativeTime } from "@/lib/dates";
import { getBadgeProgress, leagueForXp } from "@/lib/gamification";
import { ProfileCharts } from "@/components/profile/ProfileCharts";
import { StreakFlame } from "@/components/ui/StreakFlame";
import { AvatarIcon, BoltIcon, CheckIcon, EmojiIcon, FlagIcon, TargetIcon } from "@/components/icons/Icon";
import Link from "next/link";

export const metadata = { title: "پروفایل" };

export default async function ProfilePage() {
  const user = await requireUser();
  const since = addDays(new Date(), -13);
  since.setHours(0, 0, 0, 0);

  const [badges, daily, byCategory, recent, totals, completedStations] = await Promise.all([
    getBadgeProgress(user.id),
    db
      .select({ day: sql<string>`to_char(${practiceSessions.completedAt}, 'YYYY-MM-DD')`, xp: sql<number>`sum(${practiceSessions.xpEarned})::int`, n: sql<number>`count(*)::int` })
      .from(practiceSessions)
      .where(and(eq(practiceSessions.userId, user.id), gte(practiceSessions.completedAt, since)))
      .groupBy(sql`1`),
    db
      .select({ title: categories.title, color: categories.color, total: sql<number>`count(*)::int`, correct: sql<number>`sum(case when ${attempts.correct} then 1 else 0 end)::int` })
      .from(attempts)
      .innerJoin(questions, eq(attempts.questionId, questions.id))
      .innerJoin(stations, eq(questions.stationId, stations.id))
      .innerJoin(topics, eq(stations.topicId, topics.id))
      .innerJoin(categories, eq(topics.categoryId, categories.id))
      .where(eq(attempts.userId, user.id))
      .groupBy(categories.id, categories.title, categories.color),
    db
      .select({ id: practiceSessions.id, mode: practiceSessions.mode, xp: practiceSessions.xpEarned, correct: practiceSessions.correct, total: practiceSessions.total, at: practiceSessions.completedAt, station: stations.title })
      .from(practiceSessions)
      .leftJoin(stations, eq(practiceSessions.stationId, stations.id))
      .where(eq(practiceSessions.userId, user.id))
      .orderBy(desc(practiceSessions.completedAt))
      .limit(8),
    db
      .select({ total: sql<number>`count(*)::int`, correct: sql<number>`coalesce(sum(case when ${attempts.correct} then 1 else 0 end),0)::int` })
      .from(attempts)
      .where(eq(attempts.userId, user.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(stationProgress).where(and(eq(stationProgress.userId, user.id), eq(stationProgress.completed, true))),
  ]);

  const dayMap = new Map(daily.map((d) => [d.day, d]));
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), -(13 - i));
    const k = dateKey(d);
    return { label: weekdayShort(d), xp: dayMap.get(k)?.xp ?? 0, sessions: dayMap.get(k)?.n ?? 0 };
  });
  const catStats = byCategory.map((c) => ({ name: c.title, color: c.color, accuracy: c.total ? Math.round((c.correct / c.total) * 100) : 0, total: c.total })).sort((a, b) => b.accuracy - a.accuracy);
  const accuracy = totals[0].total ? Math.round((totals[0].correct / totals[0].total) * 100) : 0;
  const league = leagueForXp(user.xp);
  const earned = badges.filter((b) => b.earned);
  const MODE_LABEL: Record<string, string> = { normal: "درس", review: "مرور هوشمند", quick: "مرور سریع", timed: "زمان‌دار", competitive: "رقابتی" };

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-6 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-l from-[#14B8A6] to-[#06B6D4]" />
        <span className="relative grid h-28 w-28 place-items-center rounded-full border-4 border-[#29384d] bg-soft shadow-lg"><AvatarIcon emoji={user.avatar} className="h-16 w-16" /></span>
        <div className="relative flex-1 text-center sm:text-right sm:pt-8">
          <h1 className="text-2xl font-black">{user.name}</h1>
          <p className="text-sm text-muted">{user.email}</p>
          <p className="text-xs text-muted mt-1">عضو از {formatJalali(user.createdAt, false)} • لیگ {league.title}</p>
        </div>
        <Link href="/settings" className="relative sm:self-end btn btn-secondary !py-2 !px-4 text-sm">ویرایش پروفایل</Link>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <StreakFlame active={user.streak > 0} size="text-3xl" />, v: toPersianDigits(user.streak), l: "استریک فعلی", sub: `رکورد: ${toPersianDigits(user.longestStreak)} روز` },
          { icon: <BoltIcon className="h-8 w-8 text-amber-500" />, v: formatNumber(user.xp), l: "امتیاز کل", sub: `لیگ ${league.title}` },
          { icon: <TargetIcon className="h-8 w-8 text-[#2DD4BF]" />, v: `${toPersianDigits(accuracy)}٪`, l: "دقت پاسخ", sub: `${formatNumber(totals[0].total)} سؤال` },
          { icon: <FlagIcon className="h-8 w-8 text-emerald-400" />, v: toPersianDigits(completedStations[0].n), l: "ایستگاه کامل", sub: `${toPersianDigits(earned.length)} نشان` },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xl font-black leading-none">{s.v}</p>
              <p className="text-xs font-bold text-muted mt-1">{s.l}</p>
              <p className="text-[10px] text-muted">{s.sub}</p>
            </div>
          </div>
        ))}
      </section>

      <ProfileCharts series={series} catStats={catStats} />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black">نشان‌ها</h2>
          <span className="text-xs text-muted font-bold">{toPersianDigits(earned.length)} از {toPersianDigits(badges.length)}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {badges.map((b) => (
            <div key={b.id} className={`card p-3 text-center ${b.earned ? "" : "opacity-60"}`} title={b.description}>
              <div className={`mx-auto w-fit ${b.earned ? "animate-float" : "grayscale"}`}><EmojiIcon name={b.icon} className="h-9 w-9 text-[#2DD4BF]" /></div>
              <p className="mt-1 text-xs font-black leading-tight">{b.title}</p>
              {!b.earned ? (
                <>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--border)] overflow-hidden"><div className="h-full bg-[#2DD4BF]" style={{ width: `${(b.current / b.threshold) * 100}%` }} /></div>
                  <p className="text-[10px] text-muted mt-1">{toPersianDigits(b.current)}/{toPersianDigits(b.threshold)}</p>
                </>
              ) : (
                <p className="text-[10px] text-[#58a700] mt-1 inline-flex items-center justify-center gap-1"><CheckIcon className="h-3 w-3" /> {b.earnedAt ? relativeTime(b.earnedAt) : ""}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black mb-3">فعالیت‌های اخیر</h2>
        <ul className="card divide-y-2 divide-[var(--border)]">
          {recent.length === 0 && <li className="p-6 text-center text-muted text-sm font-bold">هنوز درسی تمام نکرده‌ای — <Link href="/learn" className="text-[#2DD4BF]">شروع کن!</Link></li>}
          {recent.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <EmojiIcon name={r.correct === r.total ? "💯" : "📘"} className="h-6 w-6 text-[#2DD4BF]" />
              <div className="flex-1 min-w-0">
                <p className="font-black truncate">{r.station ?? MODE_LABEL[r.mode] ?? r.mode}</p>
                <p className="text-xs text-muted">{toPersianDigits(r.correct)}/{toPersianDigits(r.total)} درست • {relativeTime(r.at)}</p>
              </div>
              <span className="font-black text-amber-500">+{toPersianDigits(r.xp)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
