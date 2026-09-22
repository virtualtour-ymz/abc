import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCategoriesOverview } from "@/lib/content";
import { toPersianDigits } from "@/lib/dates";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CategoryGrid } from "@/components/path/CategoryGrid";
import { EmojiIcon, WaveHandIcon } from "@/components/icons/Icon";
import { Mascot } from "@/components/mascot/Mascot";

export const metadata = { title: "یادگیری" };

export default async function LearnPage() {
  const user = await requireUser();
  const cats = await getCategoriesOverview(user.id);
  const totalStations = cats.reduce((a, c) => a + c.totalStations, 0);
  const doneStations = cats.reduce((a, c) => a + c.completedStations, 0);
  const inProgress = cats.find((c) => c.completedStations > 0 && c.percent < 100) ?? cats[0];

  return (
    <div className="flex flex-col gap-6">
      <section className="animate-fade-up rounded-3xl bg-gradient-to-l from-[#14B8A6] to-[#06B6D4] p-6 text-white shadow-xl shadow-teal-500/20 relative overflow-hidden">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute bottom-2 left-2 flex h-24 w-24 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm sm:h-28 sm:w-28">
          <Mascot mood="idle" className="h-20 sm:h-24" />
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm font-bold opacity-90">سلام {user.name.split(" ")[0]} <WaveHandIcon className="h-5 w-5" /></p>
        <h1 className="mt-1 text-2xl font-black">امروز چی یاد می‌گیریم؟</h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold mb-1 opacity-90">
              <span>پیشرفت کلی</span>
              <span>{toPersianDigits(doneStations)} از {toPersianDigits(totalStations)} ایستگاه</span>
            </div>
            <ProgressBar value={totalStations ? (doneStations / totalStations) * 100 : 0} color="#ffc800" track="rgba(255,255,255,0.25)" height={12} />
          </div>
        </div>
        {inProgress && (
          <Link href={`/learn/${inProgress.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-[#14B8A6] border-b-4 border-teal-200 active:border-b-0 active:translate-y-1 transition-all">
            <EmojiIcon name={inProgress.icon} className="h-5 w-5" /> ادامه {inProgress.title}
          </Link>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black">رشته‌های پرستاری</h2>
          <span className="text-xs text-muted font-bold">{toPersianDigits(cats.length)} دسته</span>
        </div>
        <CategoryGrid categories={cats} />
      </section>
    </div>
  );
}
