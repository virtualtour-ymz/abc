"use client";
import { useActionState, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { updateSettingsAction, logoutAction } from "@/lib/actions";
import type { PublicUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { toPersianDigits } from "@/lib/dates";
import { AvatarIcon, BellIcon, CheckIcon, SpeakerIcon } from "@/components/icons/Icon";

const AVATARS = ["🧑‍⚕️", "👩‍⚕️", "👨‍⚕️", "🧕", "👩‍🔬", "👨‍🔬", "🧑‍🎓", "👩‍🏫", "🦸‍♀️", "🦸‍♂️", "🐱", "🦊"];
const GOALS = [{ v: 5, l: "آرام", d: "۵ سؤال در روز" }, { v: 10, l: "معمولی", d: "۱۰ سؤال در روز" }, { v: 20, l: "جدی", d: "۲۰ سؤال در روز" }, { v: 30, l: "حرفه‌ای", d: "۳۰ سؤال در روز" }];

export function SettingsForm({ user }: { user: PublicUser }) {
  const [state, action, pending] = useActionState(updateSettingsAction, null);
  const [avatar, setAvatar] = useState(user.avatar);
  const [goal, setGoal] = useState(user.dailyGoal);
  const [sound, setSound] = useState(user.soundEnabled);
  const [notif, setNotif] = useState(user.notificationsEnabled);
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => { if ("Notification" in window) setPerm(Notification.permission); }, []);
  useEffect(() => { try { localStorage.setItem("sound", sound ? "on" : "off"); } catch {} }, [sound]);

  const requestNotif = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") new Notification("پرستاریار", { body: "یادآوری استریک فعال شد! هر روز یادت می‌اندازیم تمرین کنی.", icon: "/icons/icon.svg" });
  };

  return (
    <form action={action} className="flex flex-col gap-6 max-w-2xl">
      <div><h1 className="text-2xl font-black">تنظیمات</h1><p className="text-sm text-muted mt-1">پروفایل، هدف روزانه و ترجیحات</p></div>
      {(state?.error || state?.success) && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl px-4 py-2 text-sm font-bold ${state.error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700 dark:bg-green-950/40"}`}>{state.error ?? state.success}</motion.p>}

      <section className="card p-5 flex flex-col gap-4">
        <h2 className="font-black">پروفایل</h2>
        <label className="text-sm font-bold">نام<input name="name" defaultValue={user.name} className="mt-1 w-full rounded-2xl border-2 border-soft bg-soft px-4 py-3 font-bold outline-none focus:border-[#2DD4BF]" /></label>
        <div>
          <p className="text-sm font-bold mb-2">آواتار</p>
          <input type="hidden" name="avatar" value={avatar} />
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => setAvatar(a)} className={`grid h-12 w-12 place-items-center rounded-2xl border-2 transition ${avatar === a ? "border-[#2DD4BF] bg-[#0F2E2A] dark:bg-[#0F2E2A] scale-110" : "border-soft"}`}><AvatarIcon emoji={a} className="h-7 w-7" /></button>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-black mb-3">هدف روزانه</h2>
        <input type="hidden" name="dailyGoal" value={goal} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GOALS.map((g) => (
            <button key={g.v} type="button" onClick={() => setGoal(g.v)} className={`choice text-center ${goal === g.v ? "selected" : ""}`}>
              <span className="block font-black">{g.l}</span><span className="block text-xs opacity-80 mt-1">{g.d}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="font-black">ترجیحات</h2>
        <label className="flex items-center justify-between py-2 cursor-pointer"><span className="font-bold inline-flex items-center gap-1.5"><SpeakerIcon className="h-5 w-5" /> افکت‌های صوتی</span><input type="checkbox" name="soundEnabled" checked={sound} onChange={(e) => setSound(e.target.checked)} className="h-6 w-6 accent-[#58cc02]" /></label>
        <label className="flex items-center justify-between py-2 cursor-pointer"><span className="font-bold inline-flex items-center gap-1.5"><BellIcon className="h-5 w-5" /> یادآوری استریک و چالش‌ها</span><input type="checkbox" name="notificationsEnabled" checked={notif} onChange={(e) => setNotif(e.target.checked)} className="h-6 w-6 accent-[#58cc02]" /></label>
        {notif && perm !== "granted" && <button type="button" onClick={requestNotif} className="btn btn-secondary text-sm self-start">فعال‌سازی اعلان مرورگر</button>}
        {perm === "granted" && <p className="text-xs text-[#58a700] font-bold inline-flex items-center gap-1"><CheckIcon className="h-3.5 w-3.5" /> اعلان‌های مرورگر فعال است</p>}
        <div className="border-t-2 border-soft pt-2 -mx-2"><ThemeToggle /></div>
      </section>

      <section className="card p-5 text-sm text-muted">
        <p>استریک فعلی: <b className="text-orange-500">{toPersianDigits(user.streak)}</b> روز • طولانی‌ترین: <b>{toPersianDigits(user.longestStreak)}</b> روز</p>
      </section>

      <div className="flex gap-3">
        <button disabled={pending} className="btn btn-primary flex-1">{pending ? "..." : "ذخیره تغییرات"}</button>
        <button type="submit" formAction={logoutAction} className="btn btn-secondary text-[#ff4b4b]">خروج</button>
      </div>
    </form>
  );
}
