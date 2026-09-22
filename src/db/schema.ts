import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  varchar,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Users & Auth ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: varchar("avatar", { length: 16 }).notNull().default("🧑‍⚕️"),
  role: varchar("role", { length: 16 }).notNull().default("user"),
  xp: integer("xp").notNull().default(0),
  gems: integer("gems").notNull().default(100),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: varchar("last_active_date", { length: 10 }),
  dailyGoal: integer("daily_goal").notNull().default(10),
  league: varchar("league", { length: 16 }).notNull().default("bronze"),
  theme: varchar("theme", { length: 8 }).notNull().default("light"),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  resetToken: varchar("reset_token", { length: 128 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const authSessions = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Content ----------
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  color: varchar("color", { length: 16 }).notNull(),
  icon: varchar("icon", { length: 16 }).notNull(),
  order: integer("order").notNull().default(0),
});

export const topics = pgTable(
  "topics",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull().default(""),
    order: integer("order").notNull().default(0),
  },
  (t) => [index("topics_category_idx").on(t.categoryId)],
);

export const stations = pgTable(
  "stations",
  {
    id: serial("id").primaryKey(),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull().default(""),
    icon: varchar("icon", { length: 16 }).notNull().default("⭐"),
    order: integer("order").notNull().default(0),
  },
  (t) => [index("stations_topic_idx").on(t.topicId)],
);

export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "drag_drop"
  | "flashcard"
  | "scenario"
  | "true_false"
  | "image";

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    stationId: integer("station_id")
      .notNull()
      .references(() => stations.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 24 }).notNull().$type<QuestionType>(),
    prompt: text("prompt").notNull(),
    // Structured payload depending on the type (pairs, blanks, scenario, image url, etc.)
    data: jsonb("data").notNull().default({}),
    explanation: text("explanation").notNull().default(""),
    difficulty: integer("difficulty").notNull().default(1),
    tags: jsonb("tags").notNull().default([]),
    order: integer("order").notNull().default(0),
  },
  (t) => [index("questions_station_idx").on(t.stationId)],
);

export const questionOptions = pgTable(
  "question_options",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    order: integer("order").notNull().default(0),
  },
  (t) => [index("options_question_idx").on(t.questionId)],
);

// ---------- Progress & Gamification ----------
export const attempts = pgTable(
  "attempts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    correct: boolean("correct").notNull(),
    timeMs: integer("time_ms").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("attempts_user_idx").on(t.userId, t.createdAt)],
);

export const practiceSessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stationId: integer("station_id").references(() => stations.id, { onDelete: "set null" }),
    mode: varchar("mode", { length: 24 }).notNull().default("normal"),
    total: integer("total").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    xpEarned: integer("xp_earned").notNull().default(0),
    perfect: boolean("perfect").notNull().default(false),
    durationMs: integer("duration_ms").notNull().default(0),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId, t.completedAt)],
);

export const stationProgress = pgTable(
  "station_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stationId: integer("station_id")
      .notNull()
      .references(() => stations.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    crowns: integer("crowns").notNull().default(0),
    bestScore: integer("best_score").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("station_progress_unique").on(t.userId, t.stationId)],
);

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 16 }).notNull(),
  // metric: xp | streak | sessions | perfect | correct | friends | stations
  metric: varchar("metric", { length: 32 }).notNull(),
  threshold: integer("threshold").notNull(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: integer("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_badges_unique").on(t.userId, t.badgeId)],
);

// Spaced repetition (SM-2 style)
export const reviewItems = pgTable(
  "review_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    ease: real("ease").notNull().default(2.5),
    intervalDays: real("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    dueAt: timestamp("due_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("review_items_unique").on(t.userId, t.questionId),
    index("review_due_idx").on(t.userId, t.dueAt),
  ],
);

// ---------- Social ----------
export const friendships = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: integer("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | accepted
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("friendships_unique").on(t.requesterId, t.addresseeId)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: integer("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("messages_receiver_idx").on(t.receiverId, t.createdAt)],
);

export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodType: varchar("period_type", { length: 8 }).notNull(), // week | month
    periodKey: varchar("period_key", { length: 16 }).notNull(), // e.g. 2025-W12 / 2025-03
    xp: integer("xp").notNull().default(0),
  },
  (t) => [uniqueIndex("leaderboard_unique").on(t.userId, t.periodType, t.periodKey)],
);

export const dailyChallenges = pgTable(
  "daily_challenges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    // metric: questions | perfect | xp | quick
    metric: varchar("metric", { length: 16 }).notNull(),
    target: integer("target").notNull(),
    progress: integer("progress").notNull().default(0),
    reward: integer("reward").notNull(),
    claimed: boolean("claimed").notNull().default(false),
  },
  (t) => [uniqueIndex("daily_challenge_unique").on(t.userId, t.date, t.metric)],
);

export const powerUps = pgTable(
  "power_ups",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 24 }).notNull(), // streak_freeze | double_xp | hint
    quantity: integer("quantity").notNull().default(0),
  },
  (t) => [uniqueIndex("power_ups_unique").on(t.userId, t.kind)],
);

// ---------- Relations ----------
export const categoriesRelations = relations(categories, ({ many }) => ({
  topics: many(topics),
}));
export const topicsRelations = relations(topics, ({ one, many }) => ({
  category: one(categories, { fields: [topics.categoryId], references: [categories.id] }),
  stations: many(stations),
}));
export const stationsRelations = relations(stations, ({ one, many }) => ({
  topic: one(topics, { fields: [stations.topicId], references: [topics.id] }),
  questions: many(questions),
}));
export const questionsRelations = relations(questions, ({ one, many }) => ({
  station: one(stations, { fields: [questions.stationId], references: [stations.id] }),
  options: many(questionOptions),
}));
export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, { fields: [questionOptions.questionId], references: [questions.id] }),
}));

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type Badge = typeof badges.$inferSelect;
