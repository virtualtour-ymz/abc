"use client";
import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { addFriendAction, respondFriendAction, removeFriendAction, sendMessageAction, markMessagesReadAction } from "@/lib/actions";
import { formatNumber, toPersianDigits, relativeTime } from "@/lib/dates";
import { leagueInfo } from "@/lib/constants";
import { AvatarIcon, BoltIcon, EmojiIcon, FlameIcon, LetterIcon, PlusIcon, SwordsIcon } from "@/components/icons/Icon";

type Friend = { friendshipId: number; id: number; name: string; avatar: string; xp: number; streak: number; league: string; badges: { icon: string; title: string }[]; incoming: boolean };
type Msg = { id: number; text: string; read: boolean; createdAt: string; sender: string; avatar: string };

const QUICK = ["آفرین! ادامه بده", "استریکت رو نشکن", "امروز باهم تمرین کنیم؟", "تو می‌تونی!"];

export function FriendsClient({ friends, pending, inbox, myXp }: { friends: Friend[]; pending: Friend[]; inbox: Msg[]; myXp: number }) {
  const [state, action, isPending] = useActionState(addFriendAction, null);
  const [, start] = useTransition();
  const [msgFor, setMsgFor] = useState<number | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const unread = inbox.filter((m) => !m.read).length;

  const send = (id: number, text: string) => {
    start(async () => {
      await sendMessageAction(id, text);
      setSent("پیام تشویقی ارسال شد");
      setMsgFor(null);
      setTimeout(() => setSent(null), 2500);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">دوستان</h1>
        <p className="text-sm text-muted mt-1">پیشرفت دوستانت را ببین، تشویقشان کن و با آنها رقابت کن</p>
      </div>

      <form action={action} className="card p-4 flex flex-col sm:flex-row gap-2">
        <input name="email" type="email" required placeholder="ایمیل دوست (مثلاً sara@example.com)" dir="ltr" className="flex-1 rounded-2xl border-2 border-soft bg-soft px-4 py-3 font-bold outline-none focus:border-[#2DD4BF]" />
        <button disabled={isPending} className="btn btn-brand"><PlusIcon className="h-4 w-4" /> افزودن دوست</button>
      </form>
      {(state?.error || state?.success || sent) && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl px-4 py-2 text-sm font-bold ${state?.error ? "bg-red-50 text-red-600 dark:bg-red-950/40" : "bg-green-50 text-green-700 dark:bg-green-950/40"}`}>
          {sent ?? state?.error ?? state?.success}
        </motion.p>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="font-black mb-2">درخواست‌ها ({toPersianDigits(pending.length)})</h2>
          <ul className="card divide-y-2 divide-[var(--border)]">
            {pending.map((p) => (
              <li key={p.friendshipId} className="flex items-center gap-3 px-4 py-3">
                <AvatarIcon emoji={p.avatar} className="h-9 w-9" />
                <div className="flex-1"><p className="font-black">{p.name}</p><p className="text-xs text-muted">{p.incoming ? "برای شما درخواست فرستاده" : "در انتظار پذیرش"}</p></div>
                {p.incoming ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => start(() => respondFriendAction(p.friendshipId, true))} className="btn btn-primary !px-3 !py-1.5 text-xs">قبول</button>
                    <button type="button" onClick={() => start(() => respondFriendAction(p.friendshipId, false))} className="btn btn-secondary !px-3 !py-1.5 text-xs">رد</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => start(() => removeFriendAction(p.friendshipId))} className="text-xs font-bold text-muted">لغو</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-black mb-2">دوستان من ({toPersianDigits(friends.length)})</h2>
        {friends.length === 0 && <div className="card p-8 text-center text-muted text-sm font-bold">هنوز دوستی اضافه نکرده‌ای. کاربران نمونه: ali@example.com, maryam@example.com</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          {friends.map((f, i) => {
            const lg = leagueInfo(f.league);
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-soft border-2 border-soft"><AvatarIcon emoji={f.avatar} className="h-8 w-8" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black truncate">{f.name}</p>
                    <p className="text-xs text-muted inline-flex items-center gap-1"><EmojiIcon name={lg.icon} className="h-4 w-4" /> لیگ {lg.title} • <FlameIcon className="h-3.5 w-3.5 text-orange-500" /> {toPersianDigits(f.streak)} روز</p>
                    <p className="text-xs font-bold text-amber-500 mt-0.5 inline-flex items-center gap-1"><BoltIcon className="h-3.5 w-3.5" /> {formatNumber(f.xp)} XP {f.xp > myXp ? <span className="text-muted">({formatNumber(f.xp - myXp)} جلوتر از شما)</span> : <span className="text-[#58a700]">(شما جلوتر هستید)</span>}</p>
                  </div>
                </div>
                {f.badges.length > 0 && <div className="mt-2 flex gap-1.5">{f.badges.map((b, j) => <EmojiIcon key={j} name={b.icon} className="h-5 w-5 text-[#2DD4BF]" />)}</div>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setMsgFor(msgFor === f.id ? null : f.id)} className="btn btn-secondary !px-3 !py-1.5 text-xs"><LetterIcon className="h-4 w-4" /> تشویق</button>
                  <Link href={`/practice/competitive?friend=${f.id}`} className="btn btn-danger !px-3 !py-1.5 text-xs"><SwordsIcon className="h-4 w-4" /> رقابت</Link>
                  <button type="button" onClick={() => start(() => removeFriendAction(f.friendshipId))} className="mr-auto text-xs font-bold text-muted hover:text-[#ff4b4b]">حذف</button>
                </div>
                {msgFor === f.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 flex flex-wrap gap-2">
                    {QUICK.map((q) => (
                      <button key={q} type="button" onClick={() => send(f.id, q)} className="rounded-full border-2 border-soft px-3 py-1 text-xs font-bold hover:bg-soft">{q}</button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-black">پیام‌های دریافتی {unread > 0 && <span className="rounded-full bg-[#ff4b4b] px-2 py-0.5 text-xs text-white">{toPersianDigits(unread)}</span>}</h2>
          {unread > 0 && <button type="button" onClick={() => start(() => markMessagesReadAction())} className="text-xs font-bold text-[#2DD4BF]">خواندم</button>}
        </div>
        <ul className="card divide-y-2 divide-[var(--border)]">
          {inbox.length === 0 && <li className="p-6 text-center text-muted text-sm font-bold">پیامی نداری</li>}
          {inbox.map((m) => (
            <li key={m.id} className={`flex items-center gap-3 px-4 py-3 ${m.read ? "" : "bg-[#0F2E2A]/60 dark:bg-[#0F2E2A]/60"}`}>
              <AvatarIcon emoji={m.avatar} className="h-7 w-7" />
              <div className="flex-1"><p className="text-sm font-bold">{m.text}</p><p className="text-xs text-muted">{m.sender} • {relativeTime(m.createdAt)}</p></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
