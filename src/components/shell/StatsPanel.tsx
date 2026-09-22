import Link from "next/link";
import type { User } from "@/db/schema";
import { formatNumber, toPersianDigits, formatJalali } from "@/lib/dates";
import { getDailyChallenges, getTodayStats, leagueForXp, nextLeague, challengeMeta } from "@/lib/gamification";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ClaimButton } from "@/components/shell/ClaimButton";
import { StreakFlame } from "@/components/ui/StreakFlame";
import { BoltIcon, BookIcon, EmojiIcon, GemIcon, PartyIcon } from "@/components/icons/Icon";

export async function StatsPanel({ user }: { user: User }) {
  const [today, challenges] = await Promise.all([getTodayStats(user.id), getDailyChallenges(user.id)]);
  const league = leagueForXp(user.xp);
  const next = nextLeague(user.xp);
  const goalPct = Math.min(100, Math.round((today.questions / user.dailyGoal) * 100));

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar stats */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 font-black text-orange-500" title="استریک">
          <StreakFlame active={user.streak > 0} size="text-2xl" />
          <span>{toPersianDigits(user.streak)}</span>
        </div>
        <div className="flex items-center gap-1.5 font-black text-[#2DD4BF]" title="الماس">
          <GemIcon className="h-6 w-6" />
          <span>{formatNumber(user.gems)}</span>
        </div>
        <div className="flex items-center gap-1.5 font-black text-amber-500" title="امتیاز تجربه">
          <BoltIcon className="h-6 w-6" />
          <span>{formatNumber(user.xp)}</span>
        </div>
      </div>

      {/* Daily goal */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black">هدف روزانه</h3>
          <Link href="/settings" className="text-xs font-bold text-[#2DD4BF]">ویرایش</Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{goalPct >= 100 ? <PartyIcon className="h-9 w-9" /> : <BookIcon className="h-9 w-9" />}</div>
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-muted mb-1">
              <span>{toPersianDigits(today.questions)} / {toPersianDigits(user.dailyGoal)} سؤال</span>
              <span>{toPersianDigits(goalPct)}٪</span>
            </div>
            <ProgressBar value={goalPct} color="#ffc800" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">{formatJalali(new Date())} — امروز {formatNumber(today.xp)} امتیاز گرفتی</p>
      </section>

      {/* League */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black">لیگ {league.title}</h3>
          <Link href="/leaderboard" className="text-xs font-bold text-[#2DD4BF]">مشاهده لیگ</Link>
        </div>
        <div className="flex items-center gap-3">
          <EmojiIcon name={league.icon} className="h-9 w-9" />
          <div className="flex-1">
            {next ? (
              <>
                <p className="text-xs text-muted mb-1">{formatNumber(next.min - user.xp)} امتیاز تا لیگ {next.title}</p>
                <ProgressBar value={((user.xp - league.min) / (next.min - league.min)) * 100} color={league.color} height={10} />
              </>
            ) : (
              <p className="text-xs text-muted">شما در بالاترین لیگ هستید!</p>
            )}
          </div>
        </div>
      </section>

      {/* Daily challenges */}
      <section className="card p-4">
        <h3 className="font-black mb-3">چالش‌های امروز</h3>
        <ul className="flex flex-col gap-3">
          {challenges.map((c) => {
            const meta = challengeMeta(c.metric);
            const done = c.progress >= c.target;
            return (
              <li key={c.id} className="flex items-center gap-3">
                <EmojiIcon name={meta.icon} className="h-6 w-6" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="truncate">{meta.title}</span>
                    <span className="text-amber-500">+{toPersianDigits(c.reward)}</span>
                  </div>
                  <ProgressBar value={(c.progress / c.target) * 100} color={done ? "#58cc02" : "#2DD4BF"} height={8} className="mt-1" />
                </div>
                {done && <ClaimButton id={c.id} claimed={c.claimed} />}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
