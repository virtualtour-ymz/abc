import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { powerUps } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getStationMeta, getStationQuestions } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

export default async function LessonPage({ params }: { params: Promise<{ stationId: string }> }) {
  const { stationId } = await params;
  const id = Number(stationId);
  if (!Number.isFinite(id)) notFound();
  const user = await requireUser();
  const meta = await getStationMeta(id);
  if (!meta) notFound();
  const [questions, [hint]] = await Promise.all([
    getStationQuestions(id, 12),
    db.select().from(powerUps).where(and(eq(powerUps.userId, user.id), eq(powerUps.kind, "hint"))),
  ]);
  return (
    <LessonPlayer
      questions={questions}
      stationId={id}
      mode="normal"
      title={meta.station.title}
      color={meta.category.color}
      backHref={`/learn/${meta.category.slug}`}
      hints={hint?.quantity ?? 0}
      soundEnabled={user.soundEnabled}
    />
  );
}
