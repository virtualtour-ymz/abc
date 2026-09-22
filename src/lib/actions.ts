"use server";

import { z } from "zod";
import { and, eq, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  users,
  friendships,
  messages,
  powerUps,
  dailyChallenges,
  categories,
  topics,
  stations,
  questions,
  questionOptions,
} from "@/db/schema";
import { hashPassword, verifyPassword, generateToken } from "@/lib/password";
import { createSession, destroySession, getCurrentUser, requireUser } from "@/lib/auth";
import { awardXp, checkBadges, POWER_UPS, type PowerUpKind } from "@/lib/gamification";
import { ensureSeeded } from "@/db/seed";

export type ActionState = { error?: string; success?: string; token?: string } | null;

// ---------- Auth ----------
const registerSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد").max(60),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
});

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await ensureSeeded();
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (exists) return { error: "این ایمیل قبلاً ثبت شده است" };
  const avatars = ["🧑‍⚕️", "👩‍⚕️", "👨‍⚕️", "🧕", "👩‍🔬", "🧑‍🎓"];
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password), avatar: avatars[Math.floor(Math.random() * avatars.length)] })
    .returning();
  await createSession(user.id);
  redirect("/learn");
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await ensureSeeded();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "ایمیل و رمز عبور را وارد کنید" };
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "ایمیل یا رمز عبور اشتباه است" };
  }
  await createSession(user.id);
  redirect("/learn");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return { success: "اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال شد." };
  const token = generateToken(24);
  await db.update(users).set({ resetToken: token, resetTokenExpires: new Date(Date.now() + 3600000) }).where(eq(users.id, user.id));
  // In production an email would be sent (e.g. via Resend). Here we surface the link for demo purposes.
  return { success: "لینک بازیابی رمز عبور ایجاد شد (در نسخه نمایشی لینک در همین صفحه نمایش داده می‌شود).", token };
}

export async function resetPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "رمز عبور حداقل ۶ کاراکتر" };
  const [user] = await db.select().from(users).where(eq(users.resetToken, token));
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) return { error: "لینک نامعتبر یا منقضی شده است" };
  await db.update(users).set({ passwordHash: await hashPassword(password), resetToken: null, resetTokenExpires: null }).where(eq(users.id, user.id));
  await createSession(user.id);
  redirect("/learn");
}

// ---------- Settings ----------
export async function updateSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? user.name).trim();
  const avatar = String(formData.get("avatar") ?? user.avatar);
  const dailyGoal = Number(formData.get("dailyGoal") ?? user.dailyGoal);
  const soundEnabled = formData.get("soundEnabled") === "on";
  const notificationsEnabled = formData.get("notificationsEnabled") === "on";
  if (name.length < 2) return { error: "نام معتبر نیست" };
  await db
    .update(users)
    .set({ name, avatar, dailyGoal: [5, 10, 20, 30].includes(dailyGoal) ? dailyGoal : 10, soundEnabled, notificationsEnabled })
    .where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { success: "تنظیمات ذخیره شد" };
}

export async function setThemeAction(theme: "light" | "dark") {
  const user = await getCurrentUser();
  if (user) await db.update(users).set({ theme }).where(eq(users.id, user.id));
}

// ---------- Friends ----------
export async function addFriendAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const [target] = await db.select().from(users).where(eq(users.email, email));
  if (!target) return { error: "کاربری با این ایمیل پیدا نشد" };
  if (target.id === user.id) return { error: "نمی‌توانید خودتان را اضافه کنید" };
  const [existing] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, target.id)),
        and(eq(friendships.requesterId, target.id), eq(friendships.addresseeId, user.id)),
      ),
    );
  if (existing) return { error: existing.status === "accepted" ? "قبلاً دوست هستید" : "درخواست قبلاً ارسال شده" };
  await db.insert(friendships).values({ requesterId: user.id, addresseeId: target.id, status: "pending" });
  revalidatePath("/friends");
  return { success: `درخواست دوستی برای ${target.name} ارسال شد` };
}

export async function respondFriendAction(friendshipId: number, accept: boolean) {
  const user = await requireUser();
  if (accept) {
    await db.update(friendships).set({ status: "accepted" }).where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, user.id)));
    await checkBadges(user.id);
  } else {
    await db.delete(friendships).where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, user.id)));
  }
  revalidatePath("/friends");
}

export async function removeFriendAction(friendshipId: number) {
  const user = await requireUser();
  await db
    .delete(friendships)
    .where(and(eq(friendships.id, friendshipId), or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id))));
  revalidatePath("/friends");
}

export async function sendMessageAction(receiverId: number, text: string) {
  const user = await requireUser();
  const clean = text.trim().slice(0, 200);
  if (!clean) return;
  await db.insert(messages).values({ senderId: user.id, receiverId, text: clean });
  revalidatePath("/friends");
}

export async function markMessagesReadAction() {
  const user = await requireUser();
  await db.update(messages).set({ read: true }).where(eq(messages.receiverId, user.id));
}

// ---------- Shop & challenges ----------
export async function buyPowerUpAction(kind: PowerUpKind): Promise<ActionState> {
  const user = await requireUser();
  const item = POWER_UPS.find((p) => p.kind === kind);
  if (!item) return { error: "آیتم نامعتبر" };
  if (user.gems < item.price) return { error: "الماس کافی ندارید" };
  await db.update(users).set({ gems: user.gems - item.price }).where(eq(users.id, user.id));
  await db
    .insert(powerUps)
    .values({ userId: user.id, kind, quantity: 1 })
    .onConflictDoUpdate({ target: [powerUps.userId, powerUps.kind], set: { quantity: sql`${powerUps.quantity} + 1` } });
  revalidatePath("/shop");
  revalidatePath("/", "layout");
  return { success: `${item.title} خریداری شد` };
}

export async function claimChallengeAction(id: number) {
  const user = await requireUser();
  const [ch] = await db.select().from(dailyChallenges).where(and(eq(dailyChallenges.id, id), eq(dailyChallenges.userId, user.id)));
  if (!ch || ch.claimed || ch.progress < ch.target) return;
  await db.update(dailyChallenges).set({ claimed: true }).where(eq(dailyChallenges.id, id));
  await awardXp(user.id, ch.reward);
  await checkBadges(user.id);
  revalidatePath("/", "layout");
}

// ---------- Admin ----------
async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/learn");
  return user;
}

export async function createStationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const topicId = Number(formData.get("topicId"));
  const title = String(formData.get("title") ?? "").trim();
  const icon = String(formData.get("icon") ?? "⭐").trim() || "⭐";
  if (!topicId || title.length < 2) return { error: "عنوان و مبحث الزامی است" };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(stations).where(eq(stations.topicId, topicId));
  await db.insert(stations).values({ topicId, title, icon, order: n });
  revalidatePath("/admin");
  return { success: "ایستگاه ایجاد شد" };
}

export async function createTopicAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const categoryId = Number(formData.get("categoryId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!categoryId || title.length < 2) return { error: "عنوان و دسته الزامی است" };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(topics).where(eq(topics.categoryId, categoryId));
  await db.insert(topics).values({ categoryId, title, order: n });
  revalidatePath("/admin");
  return { success: "مبحث ایجاد شد" };
}

/**
 * Name-based CSV import: instead of requiring a numeric stationId (which
 * the person entering questions would have to look up in the DB first),
 * this accepts human-readable category/topic/station titles and resolves
 * or auto-creates them, then delegates to the same insertQuestion() used
 * by the single-question form and the ID-based CSV import — so grading
 * and storage logic stays identical, only the lookup step is new.
 */
const csvByNamesRowSchema = z.object({
  category: z.string().min(2, "نام رشته الزامی است"),
  topic: z.string().min(2, "نام مبحث الزامی است"),
  station: z.string().min(2, "نام ایستگاه الزامی است"),
  type: z.enum(["multiple_choice", "true_false", "fill_blank", "drag_drop", "flashcard", "scenario", "image"]),
  prompt: z.string().min(3, "متن سؤال کوتاه است"),
  explanation: z.string().optional().default(""),
  difficulty: z.coerce.number().min(1).max(3).default(1),
  tags: z.string().optional().default(""),
  options: z.string().optional().default(""),
  correctIndex: z.coerce.number().default(0),
  answers: z.string().optional().default(""),
  pairs: z.string().optional().default(""),
  back: z.string().optional().default(""),
  scenario: z.string().optional().default(""),
  image: z.string().optional().default(""),
});

export async function importCsvByNamesAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) return { error: "محتوای CSV خالی است" };
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { error: "فایل باید حداقل یک سطر هدر و یک سطر داده داشته باشد" };
  const header = parseCsvLine(lines[0]).map((h) => h.trim());

  // Cache of resolved/created station IDs within this single import run,
  // keyed by "category>topic>station" so repeated rows for the same
  // station don't re-query or re-create it.
  const stationCache = new Map<string, number>();

  async function resolveStationId(categoryTitle: string, topicTitle: string, stationTitle: string): Promise<number> {
    const key = `${categoryTitle}>${topicTitle}>${stationTitle}`;
    const cached = stationCache.get(key);
    if (cached) return cached;

    let [cat] = await db.select().from(categories).where(eq(categories.title, categoryTitle));
    if (!cat) {
      const [{ n: catCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(categories);
      [cat] = await db.insert(categories).values({ slug: `cat-${Math.random().toString(36).slice(2, 8)}`, title: categoryTitle, color: "#14b8a6", icon: "📁", order: catCount }).returning();
    }

    let [top] = await db.select().from(topics).where(and(eq(topics.categoryId, cat.id), eq(topics.title, topicTitle)));
    if (!top) {
      const [{ n: topicCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(topics).where(eq(topics.categoryId, cat.id));
      [top] = await db.insert(topics).values({ categoryId: cat.id, title: topicTitle, order: topicCount }).returning();
    }

    let [st] = await db.select().from(stations).where(and(eq(stations.topicId, top.id), eq(stations.title, stationTitle)));
    if (!st) {
      const [{ n: stationCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(stations).where(eq(stations.topicId, top.id));
      [st] = await db.insert(stations).values({ topicId: top.id, title: stationTitle, icon: "⭐", order: stationCount }).returning();
    }

    stationCache.set(key, st.id);
    return st.id;
  }

  let ok = 0;
  let createdStations = 0;
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => (row[h] = cells[idx] ?? ""));
    const parsed = csvByNamesRowSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(`سطر ${i + 1}: ${parsed.error.issues[0].message}`);
      continue;
    }
    try {
      const wasNew = !stationCache.has(`${parsed.data.category}>${parsed.data.topic}>${parsed.data.station}`);
      const stationId = await resolveStationId(parsed.data.category, parsed.data.topic, parsed.data.station);
      if (wasNew) createdStations++;
      const { category: _c, topic: _t, station: _s, ...rest } = parsed.data;
      await insertQuestion({ ...rest, stationId });
      ok++;
    } catch (e) {
      errors.push(`سطر ${i + 1}: ${e instanceof Error ? e.message : "خطا"}`);
    }
  }
  revalidatePath("/admin");
  const parts = [`${ok} سؤال وارد شد`];
  if (createdStations > 0) parts.push(`${createdStations} ایستگاه جدید ساخته شد`);
  if (errors.length) parts.push(`خطاها: ${errors.slice(0, 3).join("؛ ")}`);
  return { success: parts.join(" — ") };
}

const questionSchema = z.object({
  stationId: z.coerce.number().int().positive(),
  type: z.enum(["multiple_choice", "true_false", "fill_blank", "drag_drop", "flashcard", "scenario", "image"]),
  prompt: z.string().min(3, "متن سؤال کوتاه است"),
  explanation: z.string().optional().default(""),
  difficulty: z.coerce.number().min(1).max(3).default(1),
  tags: z.string().optional().default(""),
  options: z.string().optional().default(""),
  correctIndex: z.coerce.number().default(0),
  answers: z.string().optional().default(""),
  pairs: z.string().optional().default(""),
  back: z.string().optional().default(""),
  scenario: z.string().optional().default(""),
  image: z.string().optional().default(""),
});

export async function insertQuestion(input: z.infer<typeof questionSchema>) {
  const data: Record<string, unknown> = {};
  if (input.type === "fill_blank") data.answers = input.answers.split("|").map((s) => s.trim()).filter(Boolean);
  if (input.type === "drag_drop")
    data.pairs = input.pairs
      .split("|")
      .map((p) => p.split("=").map((s) => s.trim()))
      .filter((p) => p.length === 2)
      .map(([left, right]) => ({ left, right }));
  if (input.type === "flashcard") data.back = input.back;
  if (input.type === "scenario") data.scenario = input.scenario;
  if (input.type === "image") data.image = input.image;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(questions).where(eq(questions.stationId, input.stationId));
  const [q] = await db
    .insert(questions)
    .values({
      stationId: input.stationId,
      type: input.type,
      prompt: input.prompt,
      explanation: input.explanation,
      difficulty: input.difficulty,
      tags: input.tags.split(",").map((s) => s.trim()).filter(Boolean),
      data,
      order: n,
    })
    .returning();
  if (["multiple_choice", "scenario", "image"].includes(input.type)) {
    const opts = input.options.split("|").map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2) throw new Error("حداقل دو گزینه لازم است");
    await db.insert(questionOptions).values(opts.map((text, i) => ({ questionId: q.id, text, isCorrect: i === input.correctIndex, order: i })));
  } else if (input.type === "true_false") {
    await db.insert(questionOptions).values([
      { questionId: q.id, text: "درست", isCorrect: input.correctIndex === 0, order: 0 },
      { questionId: q.id, text: "نادرست", isCorrect: input.correctIndex === 1, order: 1 },
    ]);
  }
  return q;
}

export async function createQuestionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = questionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await insertQuestion(parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطا در ذخیره سؤال" };
  }
  revalidatePath("/admin");
  return { success: "سؤال با موفقیت اضافه شد" };
}

/** CSV columns: stationId,type,prompt,options(|),correctIndex,answers(|),pairs(a=b|c=d),back,scenario,image,explanation,difficulty,tags */
export async function importCsvAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) return { error: "محتوای CSV خالی است" };
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  let ok = 0;
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => (row[h] = cells[idx] ?? ""));
    const parsed = questionSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(`سطر ${i + 1}: ${parsed.error.issues[0].message}`);
      continue;
    }
    try {
      await insertQuestion(parsed.data);
      ok++;
    } catch (e) {
      errors.push(`سطر ${i + 1}: ${e instanceof Error ? e.message : "خطا"}`);
    }
  }
  revalidatePath("/admin");
  return { success: `${ok} سؤال وارد شد${errors.length ? ` — خطاها: ${errors.slice(0, 3).join("؛ ")}` : ""}` };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export async function getAdminTree() {
  await requireAdmin();
  const cats = await db.select().from(categories).orderBy(categories.order);
  const tps = await db.select().from(topics).orderBy(topics.order);
  const sts = await db.select().from(stations).orderBy(stations.order);
  const counts = await db.select({ stationId: questions.stationId, n: sql<number>`count(*)::int` }).from(questions).groupBy(questions.stationId);
  return { cats, tps, sts, counts };
}
