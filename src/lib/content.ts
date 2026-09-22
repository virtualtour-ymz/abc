import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, questionOptions, questions, stationProgress, stations, topics, type Question } from "@/db/schema";
import type { ClientOption, ClientQuestion } from "@/lib/client-types";

// Re-exported for backwards compatibility with existing imports of
// `ClientOption`/`ClientQuestion` from "@/lib/content". New client-side
// code should prefer importing directly from "@/lib/client-types" to avoid
// any risk of pulling this (server-only, @/db-dependent) file into a
// browser bundle.
export type { ClientOption, ClientQuestion };

export async function getCategoriesOverview(userId: number) {
  const cats = await db.select().from(categories).orderBy(asc(categories.order));
  const totals = await db
    .select({ categoryId: topics.categoryId, total: sql<number>`count(${stations.id})::int` })
    .from(topics)
    .innerJoin(stations, eq(stations.topicId, topics.id))
    .groupBy(topics.categoryId);
  const done = await db
    .select({ categoryId: topics.categoryId, done: sql<number>`count(${stationProgress.id})::int` })
    .from(stationProgress)
    .innerJoin(stations, eq(stationProgress.stationId, stations.id))
    .innerJoin(topics, eq(stations.topicId, topics.id))
    .where(and(eq(stationProgress.userId, userId), eq(stationProgress.completed, true)))
    .groupBy(topics.categoryId);
  const totalMap = new Map(totals.map((t) => [t.categoryId, t.total]));
  const doneMap = new Map(done.map((d) => [d.categoryId, d.done]));
  return cats.map((c) => {
    const total = totalMap.get(c.id) ?? 0;
    const completed = doneMap.get(c.id) ?? 0;
    return { ...c, totalStations: total, completedStations: completed, percent: total ? Math.round((completed / total) * 100) : 0 };
  });
}

export async function getCategoryPath(slug: string, userId: number, isAdmin = false) {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug));
  if (!cat) return null;
  const topicRows = await db.select().from(topics).where(eq(topics.categoryId, cat.id)).orderBy(asc(topics.order));
  const topicIds = topicRows.map((t) => t.id);
  const stationRows = topicIds.length
    ? await db.select().from(stations).where(inArray(stations.topicId, topicIds)).orderBy(asc(stations.order))
    : [];
  const stationIds = stationRows.map((s) => s.id);
  const counts = stationIds.length
    ? await db
        .select({ stationId: questions.stationId, n: sql<number>`count(*)::int` })
        .from(questions)
        .where(inArray(questions.stationId, stationIds))
        .groupBy(questions.stationId)
    : [];
  const countMap = new Map(counts.map((c) => [c.stationId, c.n]));
  const progress = stationIds.length
    ? await db.select().from(stationProgress).where(and(eq(stationProgress.userId, userId), inArray(stationProgress.stationId, stationIds)))
    : [];
  const progressMap = new Map(progress.map((p) => [p.stationId, p]));

  // Unlock logic: first station always unlocked, subsequent unlocked when
  // previous completed. Admins bypass this entirely — every station stays
  // open so they can jump in to review/QA content without having to play
  // through the whole path first.
  let previousCompleted = true;
  const orderedTopics = topicRows.map((t) => {
    const sts = stationRows
      .filter((s) => s.topicId === t.id)
      .map((s) => {
        const p = progressMap.get(s.id);
        const completed = p?.completed ?? false;
        const unlocked = isAdmin || previousCompleted;
        previousCompleted = completed;
        return { ...s, questionCount: countMap.get(s.id) ?? 0, completed, crowns: p?.crowns ?? 0, bestScore: p?.bestScore ?? 0, unlocked };
      });
    return { ...t, stations: sts };
  });
  const total = stationRows.length;
  const completed = progress.filter((p) => p.completed).length;
  return { category: cat, topics: orderedTopics, total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

function toClient(q: Question, opts: (typeof questionOptions.$inferSelect)[]): ClientQuestion {
  const rawData = (q.data ?? {}) as { answers?: string[]; pairs?: { left: string; right: string }[]; back?: string; scenario?: string; image?: string };
  // Strip anything that would leak the correct answer to the client before grading:
  // - fill_blank: "answers" holds the accepted answers
  // - drag_drop: "pairs" right-hand values reveal the correct match; we only
  //   send the left prompts and a shuffled list of right-hand texts
  const safeData: ClientQuestion["data"] = {
    back: rawData.back,
    scenario: rawData.scenario,
    image: rawData.image,
  };
  if (q.type === "drag_drop" && rawData.pairs) {
    safeData.pairLefts = rawData.pairs.map((p) => p.left);
    safeData.pairRights = shuffle(rawData.pairs.map((p) => p.right));
  }
  return {
    id: q.id,
    stationId: q.stationId,
    type: q.type,
    prompt: q.prompt,
    explanation: q.explanation,
    difficulty: q.difficulty,
    data: safeData,
    options: opts
      .filter((o) => o.questionId === q.id)
      .sort((a, b) => a.order - b.order)
      .map((o) => ({ id: o.id, text: o.text })),
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function getQuestionsByIds(ids: number[]): Promise<ClientQuestion[]> {
  if (!ids.length) return [];
  const qs = await db.select().from(questions).where(inArray(questions.id, ids));
  const opts = await db.select().from(questionOptions).where(inArray(questionOptions.questionId, ids));
  const map = new Map(qs.map((q) => [q.id, q]));
  return ids.map((id) => map.get(id)).filter((q): q is Question => Boolean(q)).map((q) => toClient(q, opts));
}

export async function getStationQuestions(stationId: number, limit = 12): Promise<ClientQuestion[]> {
  const qs = await db.select().from(questions).where(eq(questions.stationId, stationId)).orderBy(asc(questions.order)).limit(limit);
  const ids = qs.map((q) => q.id);
  const opts = ids.length ? await db.select().from(questionOptions).where(inArray(questionOptions.questionId, ids)) : [];
  return qs.map((q) => toClient(q, opts));
}

export async function getRandomQuestions(limit = 10, categorySlug?: string): Promise<ClientQuestion[]> {
  let idRows: { id: number }[];
  if (categorySlug) {
    idRows = await db
      .select({ id: questions.id })
      .from(questions)
      .innerJoin(stations, eq(questions.stationId, stations.id))
      .innerJoin(topics, eq(stations.topicId, topics.id))
      .innerJoin(categories, eq(topics.categoryId, categories.id))
      .where(eq(categories.slug, categorySlug))
      .orderBy(sql`random()`)
      .limit(limit);
  } else {
    idRows = await db.select({ id: questions.id }).from(questions).orderBy(sql`random()`).limit(limit);
  }
  return getQuestionsByIds(idRows.map((r) => r.id));
}

export async function getStationMeta(stationId: number) {
  const [row] = await db
    .select({ station: stations, topic: topics, category: categories })
    .from(stations)
    .innerJoin(topics, eq(stations.topicId, topics.id))
    .innerJoin(categories, eq(topics.categoryId, categories.id))
    .where(eq(stations.id, stationId));
  return row ?? null;
}
