"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { logoutAction } from "@/lib/actions";
import { EmojiIcon, GearIcon, LogoutIcon, StethoscopeIcon } from "@/components/icons/Icon";

export const NAV_ITEMS = [
  { href: "/learn", label: "یادگیری", icon: "🏠" },
  { href: "/practice", label: "تمرین", icon: "🎯" },
  { href: "/leaderboard", label: "لیگ", icon: "🏆" },
  { href: "/friends", label: "دوستان", icon: "🤝" },
  { href: "/shop", label: "فروشگاه", icon: "💎" },
  { href: "/profile", label: "پروفایل", icon: "👤" },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, { href: "/admin", label: "مدیریت", icon: "🛠️" }] : NAV_ITEMS;
  return (
    <aside className="hidden lg:flex fixed right-0 top-0 h-dvh w-64 flex-col border-l-2 border-soft bg-[var(--bg)] px-4 py-6 z-40">
      <Link href="/learn" className="flex items-center gap-2 px-3 mb-6">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] text-white shadow-lg shadow-teal-500/30"><StethoscopeIcon className="h-6 w-6" /></span>
        <span className="text-2xl font-black bg-gradient-to-l from-[#14B8A6] to-[#06B6D4] bg-clip-text text-transparent">پرستاریار</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-extrabold uppercase transition ${
                active
                  ? "border-2 border-[#2DD4BF] bg-[#0F2E2A] text-[#2DD4BF] dark:bg-[#0F2E2A] dark:border-[#2DD4BF]"
                  : "border-2 border-transparent text-muted hover:bg-soft"
              }`}
            >
              <EmojiIcon name={item.icon} className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1">
        <Link href="/settings" className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-extrabold transition border-2 ${pathname === "/settings" ? "border-[#2DD4BF] bg-[#0F2E2A] text-[#2DD4BF] dark:bg-[#0F2E2A]" : "border-transparent text-muted hover:bg-soft"}`}>
          <GearIcon className="h-6 w-6" />
          <span>تنظیمات</span>
        </Link>
        <ThemeToggle />
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-extrabold text-muted hover:bg-soft border-2 border-transparent">
            <LogoutIcon className="h-6 w-6" />
            <span>خروج</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-soft bg-[var(--bg)] safe-bottom">
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                className={`flex flex-col items-center justify-center py-2 gap-0.5 transition ${active ? "text-[#2DD4BF]" : "text-muted"}`}
              >
                <span className={`leading-none rounded-xl px-3 py-1 ${active ? "bg-[#0F2E2A] dark:bg-[#0F2E2A] border-2 border-[#2DD4BF]" : ""}`}><EmojiIcon name={item.icon} className="h-6 w-6" /></span>
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
