import { notFound } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getDueReviewQuestionIds } from "@/lib/gamification";
import { getQuestionsByIds, getRandomQuestions } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

const MODES = {
  review: { title: "مرور هوشمند", color: "#06B6D4" },
  quick: { title: "مرور سریع", color: "#2DD4BF" },
  timed: { title: "چالش زمان‌دار", color: "#ff9600" },
  competitive: { title: "رقابت با دوست", color: "#ff4b4b" },
} as const;

export default async function PracticeModePage({ params, searchParams }: { params: Promise<{ mode: string }>; searchParams: Promise<{ category?: string; friend?: string }> }) {
  const { mode } = await params;
  const { category, friend } = await searchParams;
  if (!(mode in MODES)) notFound();
  const m = mode as keyof typeof MODES;
  const user = await requireUser();

  let questions = [] as Awaited<ReturnType<typeof getRandomQuestions>>;
  if (m === "review") {
    const ids = await getDueReviewQuestionIds(user.id, 10);
    questions = await getQuestionsByIds(ids);
    if (questions.length < 5) {
      const extra = await getRandomQuestions(10 - questions.length, category);
      const seen = new Set(questions.map((q) => q.id));
      questions = questions.concat(extra.filter((q) => !seen.has(q.id)));
    }
  } else {
    questions = await getRandomQuestions(m === "timed" ? 12 : 10, category);
  }

  let opponent: { name: string; avatar: string; accuracy: number } | null = null;
  if (m === "competitive") {
    let friendId = Number(friend);
    if (!friendId) {
      const [f] = await db
        .select()
        .from(friendships)
        .where(and(eq(friendships.status, "accepted"), or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id))))
        .limit(1);
      friendId = f ? (f.requesterId === user.id ? f.addresseeId : f.requesterId) : 0;
    }
    const [fu] = friendId ? await db.select().from(users).where(eq(users.id, friendId)) : [];
    opponent = fu
      ? { name: fu.name, avatar: fu.avatar, accuracy: Math.min(0.9, 0.5 + fu.xp / 8000) }
      : { name: "ربات پرستار", avatar: "🤖", accuracy: 0.65 };
  }

  return (
    <LessonPlayer
      questions={questions}
      stationId={null}
      mode={m}
      title={MODES[m].title}
      color={MODES[m].color}
      backHref="/practice"
      soundEnabled={user.soundEnabled}
      opponent={opponent}
      timePerQuestion={15}
    />
  );
}
