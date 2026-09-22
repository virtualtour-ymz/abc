import { formatNumber, toPersianDigits } from "@/lib/dates";
import { StreakFlame } from "@/components/ui/StreakFlame";
import { BoltIcon, GemIcon, StethoscopeIcon } from "@/components/icons/Icon";
import Link from "next/link";

export function MobileTopBar({ streak, gems, xp }: { streak: number; gems: number; xp: number }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 border-b-2 border-soft bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link href="/learn" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] text-white"><StethoscopeIcon className="h-5 w-5" /></span>
          <span className="font-black text-lg bg-gradient-to-l from-[#14B8A6] to-[#06B6D4] bg-clip-text text-transparent">پرستاریار</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-black">
          <span className="flex items-center gap-1 text-orange-500"><StreakFlame active={streak > 0} size="text-xl" />{toPersianDigits(streak)}</span>
          <span className="flex items-center gap-1 text-[#2DD4BF]"><GemIcon className="h-5 w-5" />{formatNumber(gems)}</span>
          <span className="flex items-center gap-1 text-amber-500"><BoltIcon className="h-5 w-5" />{formatNumber(xp)}</span>
        </div>
      </div>
    </header>
  );
}
