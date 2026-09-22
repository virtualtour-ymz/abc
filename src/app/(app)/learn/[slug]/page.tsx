import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCategoryPath } from "@/lib/content";
import { toPersianDigits } from "@/lib/dates";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LearningPath } from "@/components/path/LearningPath";
import { CONTENT } from "@/db/seed-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: CONTENT.find((c) => c.slug === slug)?.title ?? "مسیر یادگیری" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const data = await getCategoryPath(slug, user.id, user.role === "admin");
  if (!data) notFound();
  const { category, topics, percent, completed, total } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-[52px] lg:top-0 z-20 -mx-4 px-4 pt-2 pb-3 bg-[var(--bg)]/95 backdrop-blur">
        <div className="rounded-2xl p-4 text-white shadow-lg" style={{ background: category.color }}>
          <div className="flex items-center justify-between">
            <Link href="/learn" className="text-sm font-bold opacity-90 hover:opacity-100">→ همه رشته‌ها</Link>
            <span className="text-xs font-bold opacity-90">{toPersianDigits(completed)}/{toPersianDigits(total)} ایستگاه</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-4xl">{category.icon}</span>
            <div className="flex-1">
              <h1 className="text-xl font-black">{category.title}</h1>
              <p className="text-xs opacity-90">{category.description}</p>
            </div>
            <span className="text-2xl font-black">{toPersianDigits(percent)}٪</span>
          </div>
          <ProgressBar value={percent} color="#ffffff" track="rgba(255,255,255,0.3)" height={8} className="mt-3" />
        </div>
      </div>
      <LearningPath topics={topics} color={category.color} />
    </div>
  );
}
