import Link from "next/link";
import { and, eq, lte, sql, or } from "drizzle-orm";
import { db } from "@/db";
import { reviewItems, friendships, users, categories } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { toPersianDigits } from "@/lib/dates";
import { AvatarIcon, EmojiIcon } from "@/components/icons/Icon";

export const metadata = { title: "تمرین" };

export default async function PracticePage() {
  const user = await requireUser();
  const [{ due }] = await db
    .select({ due: sql<number>`count(*)::int` })
    .from(reviewItems)
    .where(and(eq(reviewItems.userId, user.id), lte(reviewItems.dueAt, new Date())));
  const [{ weak }] = await db
    .select({ weak: sql<number>`count(*)::int` })
    .from(reviewItems)
    .where(and(eq(reviewItems.userId, user.id), sql`${reviewItems.lapses} >= 2`));
  const friends = await db
    .select({ id: users.id, name: users.name, avatar: users.avatar })
    .from(friendships)
    .innerJoin(users, or(and(eq(friendships.requesterId, user.id), eq(users.id, friendships.addresseeId)), and(eq(friendships.addresseeId, user.id), eq(users.id, friendships.requesterId))))
    .where(eq(friendships.status, "accepted"));
  const cats = await db.select().from(categories).orderBy(categories.order);

  const modes = [
    { href: "/practice/review", icon: "🧠", title: "مرور هوشمند", desc: `${toPersianDigits(due)} سؤال آماده مرور • ${toPersianDigits(weak)} نقطه ضعف`, color: "#06B6D4", badge: due > 0 ? toPersianDigits(due) : null },
    { href: "/practice/quick", icon: "⚡", title: "مرور سریع", desc: "۱۰ سؤال ترکیبی از همه رشته‌ها", color: "#2DD4BF", badge: null },
    { href: "/practice/timed", icon: "⏱️", title: "چالش زمان‌دار", desc: "۱۵ ثانیه برای هر سؤال — سرعت و دقت", color: "#ff9600", badge: null },
    { href: "/practice/competitive", icon: "⚔️", title: "رقابت با دوست", desc: friends.length ? `رقابت با ${friends[0].name}` : "رقابت با ربات پرستار", color: "#ff4b4b", badge: null },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-black">تمرین</h1>
        <p className="text-sm text-muted mt-1">حالت تمرین دلخواهت را انتخاب کن</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((m) => (
          <Link key={m.href} href={m.href} className="card-3d relative p-5 flex items-center gap-4 transition hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2" style={{ borderColor: m.color }}>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl" style={{ background: `${m.color}22` }}><EmojiIcon name={m.icon} className="h-9 w-9" style={{ color: m.color }} /></span>
            <div className="flex-1">
              <h2 className="font-black text-lg" style={{ color: m.color }}>{m.title}</h2>
              <p className="text-xs text-muted mt-1">{m.desc}</p>
            </div>
            {m.badge && <span className="absolute -top-2 -left-2 grid h-8 min-w-8 place-items-center rounded-full bg-[#ff4b4b] px-2 text-xs font-black text-white animate-bounce-slow">{m.badge}</span>}
          </Link>
        ))}
      </div>

      {friends.length > 1 && (
        <section>
          <h2 className="font-black mb-2">انتخاب حریف</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {friends.map((f) => (
              <Link key={f.id} href={`/practice/competitive?friend=${f.id}`} className="card px-4 py-2 flex items-center gap-2 whitespace-nowrap text-sm font-bold hover:bg-soft">
                <AvatarIcon emoji={f.avatar} className="h-6 w-6" />{f.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-black mb-2">مرور سریع بر اساس رشته</h2>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link key={c.id} href={`/practice/quick?category=${c.slug}`} className="inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition hover:opacity-80" style={{ borderColor: c.color, color: c.color }}>
              <EmojiIcon name={c.icon} className="h-4 w-4" /> {c.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
