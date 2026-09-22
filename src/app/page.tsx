import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CONTENT } from "@/db/seed-content";
import { EmojiIcon, StethoscopeIcon } from "@/components/icons/Icon";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/learn");
  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#0F172A] via-[#0F172A] to-[#0B1220]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] text-white"><StethoscopeIcon className="h-6 w-6" /></span>
          <span className="text-2xl font-black bg-gradient-to-l from-[#14B8A6] to-[#06B6D4] bg-clip-text text-transparent">پرستاریار</span>
        </div>
        <Link href="/login" className="btn btn-secondary !py-2 !px-4 text-sm">ورود</Link>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-2 lg:py-20">
        <div className="order-2 lg:order-1 text-center lg:text-right">
          <h1 className="text-3xl lg:text-5xl font-black leading-tight">
            پرستاری را <span className="bg-gradient-to-l from-[#14B8A6] to-[#06B6D4] bg-clip-text text-transparent">بازی‌گونه</span> یاد بگیر
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            روزی چند دقیقه تمرین، سؤالات بالینی واقعی، امتیاز و استریک، لیگ‌های رقابتی و مرور هوشمند — همه در یک اپ فارسی به سبک دولینگو.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link href="/register" className="btn btn-primary text-base">شروع رایگان</Link>
            <Link href="/login" className="btn btn-secondary text-base">قبلاً حساب دارم</Link>
          </div>
        </div>
        <div className="order-1 lg:order-2 grid grid-cols-3 gap-3">
          {CONTENT.map((c, i) => (
            <div key={c.slug} className="card-3d p-4 text-center animate-float" style={{ animationDelay: `${i * 0.2}s`, borderColor: c.color }}>
              <EmojiIcon name={c.icon} className="mx-auto h-9 w-9" style={{ color: c.color }} />
              <div className="mt-2 text-xs font-black" style={{ color: c.color }}>{c.title}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["🔥", "استریک روزانه", "هر روز تمرین کن و زنجیره‌ات را نشکن"],
          ["🏆", "لیگ‌های رقابتی", "از برنز تا الماس با دوستانت رقابت کن"],
          ["🧠", "مرور هوشمند", "سؤالات اشتباه با الگوریتم SRS دوباره می‌آیند"],
          ["🎯", "چالش‌های روزانه", "پاداش‌های ویژه برای اهداف روزانه"],
        ].map(([icon, title, desc]) => (
          <div key={title} className="card p-5">
            <EmojiIcon name={icon} className="h-8 w-8 text-[#2DD4BF]" />
            <h3 className="mt-2 font-black">{title}</h3>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
