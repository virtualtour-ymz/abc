import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStudentDetail } from "@/lib/teacher-stats";
import { toPersianDigits } from "@/lib/dates";
import { AvatarIcon, CheckIcon, EmojiIcon, FlameIcon, XIcon } from "@/components/icons/Icon";

export const metadata = { title: "جزئیات دانشجو" };

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/learn");
  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId)) notFound();
  const student = await getStudentDetail(studentId);
  if (!student) notFound();

  const totalCorrect = student.byTopic.reduce((a, t) => a + t.correctCount, 0);
  const totalWrong = student.byTopic.reduce((a, t) => a + t.wrongCount, 0);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin" className="text-sm font-bold text-[#2DD4BF] hover:underline">← بازگشت به لیست دانشجویان</Link>
      <div className="card p-5 flex items-center gap-4">
        <AvatarIcon emoji={student.avatar} className="h-10 w-10" />
        <div>
          <h1 className="text-xl font-black">{student.name}</h1>
          <p className="text-sm text-muted" dir="ltr">{student.email}</p>
        </div>
        <div className="mr-auto flex gap-4 text-center">
          <div><p className="text-lg font-black text-[#58cc02]">{toPersianDigits(totalCorrect)}</p><p className="text-xs text-muted">صحیح</p></div>
          <div><p className="text-lg font-black text-[#ff4b4b]">{toPersianDigits(totalWrong)}</p><p className="text-xs text-muted">غلط</p></div>
          <div><p className="text-lg font-black">{toPersianDigits(student.xp)}</p><p className="text-xs text-muted">XP</p></div>
          <div><p className="text-lg font-black inline-flex items-center gap-1"><FlameIcon className="h-5 w-5 text-orange-500" />{toPersianDigits(student.streak)}</p><p className="text-xs text-muted">استریک</p></div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-black mb-4">عملکرد به تفکیک مبحث</h2>
        {student.byTopic.length === 0 ? (
          <p className="text-sm text-muted">این دانشجو هنوز هیچ سؤالی پاسخ نداده است.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {student.byTopic.map((t) => (
              <div key={t.topicId} className="flex items-center gap-3 rounded-2xl border-2 border-soft p-3">
                <EmojiIcon name={t.categoryIcon} className="h-5 w-5" style={{ color: t.categoryColor }} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{t.topicTitle}</p>
                  <p className="text-xs text-muted">{t.categoryTitle}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm font-bold">
                  <span className="inline-flex items-center gap-1 text-[#58cc02]"><CheckIcon className="h-4 w-4" /> {toPersianDigits(t.correctCount)}</span>
                  <span className="inline-flex items-center gap-1 text-[#ff4b4b]"><XIcon className="h-4 w-4" /> {toPersianDigits(t.wrongCount)}</span>
                  {t.accuracyPct !== null && (
                    <span className="rounded-full bg-soft px-2 py-1 text-xs">{toPersianDigits(t.accuracyPct)}٪</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
