"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createQuestionAction, createStationAction, createTopicAction, importCsvAction, importCsvByNamesAction, type ActionState } from "@/lib/actions";
import { toPersianDigits } from "@/lib/dates";
import { AvatarIcon, BarChartIcon, CheckIcon, EmojiIcon, FlameIcon, FolderIcon, GraduationIcon, InboxIcon, PlusIcon, WrenchIcon, XIcon } from "@/components/icons/Icon";

type Cat = { id: number; title: string; color: string; icon: string };
type Topic = { id: number; categoryId: number; title: string };
type Station = { id: number; topicId: number; title: string; icon: string; count: number };
type StudentRow = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  accuracyPct: number | null;
  stationsCompleted: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  xp: number;
};

const input = "w-full rounded-2xl border-2 border-soft bg-soft px-4 py-3 font-bold outline-none focus:border-[#2DD4BF] text-sm";
const TYPES = [
  ["multiple_choice", "چهارگزینه‌ای"], ["true_false", "درست/نادرست"], ["fill_blank", "جای خالی"], ["drag_drop", "جفت‌سازی"],
  ["flashcard", "فلش‌کارت"], ["scenario", "سناریوی بالینی"], ["image", "تصویری"],
] as const;

function Msg({ s }: { s: ActionState }) {
  if (!s?.error && !s?.success) return null;
  return <p className={`rounded-xl px-4 py-2 text-sm font-bold ${s.error ? "bg-red-50 text-red-600 dark:bg-red-950/40" : "bg-green-50 text-green-700 dark:bg-green-950/40"}`}>{s.error ?? s.success}</p>;
}

/**
 * Multiple-choice / scenario / image option editor: one text input per
 * option (instead of a single "type them separated by |" field), with a
 * radio button per row to pick the correct one and +/- buttons to add or
 * remove rows. Tab moves straight from one option to the next.
 */
function OptionsEditor({ options, setOptions, correctIndex, setCorrectIndex }: { options: string[]; setOptions: (v: string[]) => void; correctIndex: number; setCorrectIndex: (v: number) => void }) {
  const update = (i: number, v: string) => setOptions(options.map((o, idx) => (idx === i ? v : o)));
  const add = () => setOptions([...options, ""]);
  const remove = (i: number) => {
    setOptions(options.filter((_, idx) => idx !== i));
    if (correctIndex === i) setCorrectIndex(0);
    else if (correctIndex > i) setCorrectIndex(correctIndex - 1);
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold">گزینه‌ها (دایره‌ی سبز = پاسخ صحیح)</span>
      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCorrectIndex(i)}
            title="پاسخ صحیح"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-black transition ${correctIndex === i ? "border-[#58cc02] bg-[#58cc02] text-white" : "border-soft text-muted"}`}
          >
            {correctIndex === i ? <CheckIcon className="h-4 w-4" /> : i + 1}
          </button>
          <input value={o} onChange={(e) => update(i, e.target.value)} placeholder={`گزینه ${toPersianDigits(i + 1)}`} className={input} />
          {options.length > 2 && (
            <button type="button" onClick={() => remove(i)} className="shrink-0 text-muted hover:text-[#ff4b4b]" title="حذف"><XIcon className="h-5 w-5" /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="self-start text-xs font-black text-[#2DD4BF] hover:underline">+ افزودن گزینه</button>
    </div>
  );
}

/**
 * Fill-in-the-blank accepted-answers editor: one input per accepted
 * spelling/synonym instead of a single "|"-separated field.
 */
function AnswersEditor({ answers, setAnswers }: { answers: string[]; setAnswers: (v: string[]) => void }) {
  const update = (i: number, v: string) => setAnswers(answers.map((a, idx) => (idx === i ? v : a)));
  const add = () => setAnswers([...answers, ""]);
  const remove = (i: number) => setAnswers(answers.filter((_, idx) => idx !== i));
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold">پاسخ‌های قابل قبول (برای مترادف‌ها ردیف جدید اضافه کنید)</span>
      {answers.map((a, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={a} onChange={(e) => update(i, e.target.value)} placeholder={i === 0 ? "پاسخ اصلی" : "مترادف/املای دیگر"} className={input} />
          {answers.length > 1 && (
            <button type="button" onClick={() => remove(i)} className="shrink-0 text-muted hover:text-[#ff4b4b]" title="حذف"><XIcon className="h-5 w-5" /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="self-start text-xs font-black text-[#2DD4BF] hover:underline">+ افزودن مترادف</button>
    </div>
  );
}

/**
 * Drag-drop pair editor: one left/right input pair per row instead of the
 * "چپ=راست | چپ=راست" mini-syntax.
 */
function PairsEditor({ pairs, setPairs }: { pairs: { left: string; right: string }[]; setPairs: (v: { left: string; right: string }[]) => void }) {
  const update = (i: number, side: "left" | "right", v: string) => setPairs(pairs.map((p, idx) => (idx === i ? { ...p, [side]: v } : p)));
  const add = () => setPairs([...pairs, { left: "", right: "" }]);
  const remove = (i: number) => setPairs(pairs.filter((_, idx) => idx !== i));
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold">جفت‌ها</span>
      {pairs.map((p, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <input value={p.left} onChange={(e) => update(i, "left", e.target.value)} placeholder="مثلاً هپارین" className={input} />
          <input value={p.right} onChange={(e) => update(i, "right", e.target.value)} placeholder="مثلاً aPTT" className={input} />
          {pairs.length > 1 && (
            <button type="button" onClick={() => remove(i)} className="shrink-0 text-muted hover:text-[#ff4b4b]" title="حذف"><XIcon className="h-5 w-5" /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="self-start text-xs font-black text-[#2DD4BF] hover:underline">+ افزودن جفت</button>
    </div>
  );
}

export function AdminPanel({ categories, topics, stations, students }: { categories: Cat[]; topics: Topic[]; stations: Station[]; students: StudentRow[] }) {
  const [tab, setTab] = useState<"question" | "structure" | "import" | "overview" | "students">("question");
  const [qState, qAction, qPending] = useActionState(createQuestionAction, null);
  const [sState, sAction] = useActionState(createStationAction, null);
  const [tState, tAction] = useActionState(createTopicAction, null);
  const [iState, iAction, iPending] = useActionState(importCsvAction, null);
  const [nState, nAction, nPending] = useActionState(importCsvByNamesAction, null);
  const [showAdvancedImport, setShowAdvancedImport] = useState(false);
  const [type, setType] = useState<string>("multiple_choice");
  // Remembers the last-used station across submissions, since consecutive
  // questions are almost always added to the same station — avoids
  // re-selecting it from the (long) grouped dropdown every time.
  const [stationId, setStationId] = useState<number | "">("");
  // Per-question-type structured fields, replacing the old "|"-separated
  // text inputs. These are serialized into the hidden fields the server
  // action already expects (options/correctIndex/answers/pairs) right
  // before submit — the server-side parsing logic is untouched.
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([""]);
  const [pairs, setPairs] = useState<{ left: string; right: string }[]>([{ left: "", right: "" }]);
  const formRef = useRef<HTMLFormElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const totalQ = stations.reduce((a, s) => a + s.count, 0);

  const resetQuestionFields = () => {
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
    setAnswers([""]);
    setPairs([{ left: "", right: "" }]);
  };

  // After a successful save: clear only the per-question fields (prompt,
  // options, answers, etc.) while keeping station + type selected, then
  // return focus to the prompt field so typing the next question needs no
  // mouse clicks at all.
  useEffect(() => {
    if (qState?.success) {
      const form = formRef.current;
      if (form) {
        const keep = new Set(["stationId", "type", "difficulty"]);
        for (const el of Array.from(form.elements)) {
          const field = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (!field.name || keep.has(field.name)) continue;
          if (field instanceof HTMLInputElement && field.type === "number") continue;
          if (field instanceof HTMLInputElement && field.type === "hidden") continue; // set programmatically on next submit
          field.value = "";
        }
      }
      resetQuestionFields();
      promptRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qState]);

  // Ctrl+Enter anywhere in the question form submits it — one less trip to
  // the mouse for the save button.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && tab === "question") {
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [tab]);

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="inline-flex items-center gap-2 text-2xl font-black"><WrenchIcon className="h-6 w-6 text-[#2DD4BF]" /> پنل مدیریت محتوا</h1><p className="text-sm text-muted mt-1">{toPersianDigits(categories.length)} رشته • {toPersianDigits(topics.length)} مبحث • {toPersianDigits(stations.length)} ایستگاه • {toPersianDigits(totalQ)} سؤال</p></div>
      <div className="flex rounded-2xl border-2 border-soft p-1 bg-soft overflow-x-auto scrollbar-hide">
        {([["question", <span key="q" className="inline-flex items-center gap-1.5"><PlusIcon className="h-4 w-4" /> سؤال جدید</span>], ["structure", <span key="s" className="inline-flex items-center gap-1.5"><FolderIcon className="h-4 w-4" /> مبحث و ایستگاه</span>], ["import", <span key="i" className="inline-flex items-center gap-1.5"><InboxIcon className="h-4 w-4" /> ورود CSV</span>], ["overview", <span key="o" className="inline-flex items-center gap-1.5"><BarChartIcon className="h-4 w-4" /> نمای کلی</span>], ["students", <span key="st" className="inline-flex items-center gap-1.5"><GraduationIcon className="h-4 w-4" /> دانشجویان</span>]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black transition inline-flex items-center justify-center ${tab === k ? "bg-[var(--card)] text-[#2DD4BF] shadow" : "text-muted"}`}>{l}</button>
        ))}
      </div>

      {tab === "question" && (
        <form ref={formRef} action={qAction} className="card p-5 flex flex-col gap-4">
          <Msg s={qState} />
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold">ایستگاه
              <select name="stationId" required value={stationId} onChange={(e) => setStationId(Number(e.target.value))} className={input}>
                <option value="" disabled>انتخاب کنید...</option>
                {categories.map((c) => (
                  <optgroup key={c.id} label={c.title}>
                    {topics.filter((t) => t.categoryId === c.id).flatMap((t) => stations.filter((s) => s.topicId === t.id).map((s) => <option key={s.id} value={s.id}>{t.title} › {s.title} ({s.count})</option>))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold">نوع سؤال
              <select name="type" value={type} onChange={(e) => { setType(e.target.value); resetQuestionFields(); }} className={input}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
          </div>

          {type === "scenario" && <label className="text-xs font-bold">متن سناریو<textarea name="scenario" rows={3} className={input} /></label>}
          {type === "image" && <label className="text-xs font-bold">آدرس تصویر (مثلاً /images/defibrillator.jpg)<input name="image" dir="ltr" className={input} /></label>}

          <label className="text-xs font-bold">متن سؤال {type === "fill_blank" && "(جای خالی را با ____ مشخص کنید)"}<textarea ref={promptRef} name="prompt" rows={2} required autoFocus className={input} /></label>

          {["multiple_choice", "scenario", "image"].includes(type) && (
            <>
              <OptionsEditor options={options} setOptions={setOptions} correctIndex={correctIndex} setCorrectIndex={setCorrectIndex} />
              <input type="hidden" name="options" value={options.join("|")} />
              <input type="hidden" name="correctIndex" value={String(correctIndex)} />
            </>
          )}

          {type === "true_false" && <label className="text-xs font-bold">پاسخ<select name="correctIndex" className={input}><option value={0}>درست</option><option value={1}>نادرست</option></select></label>}

          {type === "fill_blank" && (
            <>
              <AnswersEditor answers={answers} setAnswers={setAnswers} />
              <input type="hidden" name="answers" value={answers.join("|")} />
            </>
          )}

          {type === "drag_drop" && (
            <>
              <PairsEditor pairs={pairs} setPairs={setPairs} />
              <input type="hidden" name="pairs" value={pairs.map((p) => `${p.left}=${p.right}`).join("|")} />
            </>
          )}

          {type === "flashcard" && <label className="text-xs font-bold">پشت کارت (پاسخ)<textarea name="back" rows={2} className={input} /></label>}

          <label className="text-xs font-bold">توضیح پاسخ<textarea name="explanation" rows={2} className={input} /></label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold">سختی (۱ تا ۳)<input name="difficulty" type="number" min={1} max={3} defaultValue={1} className={input} /></label>
            <label className="text-xs font-bold">برچسب‌ها (با , جدا کنید)<input name="tags" className={input} /></label>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={qPending || !stationId} className="btn btn-primary self-start">{qPending ? "..." : "ذخیره سؤال"}</button>
            <span className="text-xs text-muted">یا Ctrl+Enter برای ذخیره‌ی سریع</span>
          </div>
        </form>
      )}

      {tab === "structure" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <form action={tAction} className="card p-5 flex flex-col gap-3">
            <h2 className="font-black">مبحث جدید</h2>
            <Msg s={tState} />
            <select name="categoryId" className={input}>{categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            <input name="title" required placeholder="عنوان مبحث" className={input} />
            <button className="btn btn-brand self-start text-sm">ایجاد مبحث</button>
          </form>
          <form action={sAction} className="card p-5 flex flex-col gap-3">
            <h2 className="font-black">ایستگاه جدید</h2>
            <Msg s={sState} />
            <select name="topicId" className={input}>
              {categories.map((c) => <optgroup key={c.id} label={c.title}>{topics.filter((t) => t.categoryId === c.id).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</optgroup>)}
            </select>
            <div className="grid grid-cols-[1fr_90px] gap-3"><input name="title" required placeholder="عنوان ایستگاه" className={input} /><input name="icon" placeholder="آیکون" className={input} /></div>
            <button className="btn btn-brand self-start text-sm">ایجاد ایستگاه</button>
          </form>
        </div>
      )}

      {tab === "import" && (
        <div className="flex flex-col gap-4">
          <form action={nAction} className="card p-5 flex flex-col gap-3">
            <h2 className="font-black">ورود گروهی سؤالات</h2>
            <p className="text-xs text-muted leading-relaxed">
              فقط اسم رشته، مبحث و ایستگاه را بنویسید — اگر وجود نداشته باشند خودش می‌سازد، پس نیازی به پیدا کردن شماره‌ی ایستگاه نیست. ستون‌ها: <code dir="ltr" className="bg-soft px-1 rounded">category,topic,station,type,prompt,options,correctIndex,answers,pairs,back,scenario,image,explanation,difficulty,tags</code>
              <br />گزینه‌ها و پاسخ‌ها را با <b>|</b> جدا کنید (مثلاً <code dir="ltr" className="bg-soft px-1 rounded">گزینه۱|گزینه۲|گزینه۳</code>) و جفت‌ها را با <code dir="ltr" className="bg-soft px-1 rounded">چپ=راست|چپ=راست</code>. فایل اکسل را با «ذخیره به‌عنوان CSV» تبدیل کنید و محتوا را اینجا بچسبانید.
            </p>
            <Msg s={nState} />
            <textarea
              name="csv"
              rows={10}
              dir="ltr"
              className={`${input} font-mono text-xs`}
              placeholder={`category,topic,station,type,prompt,options,correctIndex,answers,pairs,back,scenario,image,explanation,difficulty,tags\nICU,احیای قلبی‌ریوی,مراحل CPR,multiple_choice,"نسبت فشردن به تنفس؟","15:2|30:2|5:1|30:1",1,,,,,,"طبق AHA",1,"cpr"`}
            />
            <button disabled={nPending} className="btn btn-primary self-start">{nPending ? "در حال ورود..." : "ورود سؤالات"}</button>
          </form>

          <button type="button" onClick={() => setShowAdvancedImport((v) => !v)} className="self-start text-xs font-black text-[#2DD4BF] hover:underline">
            {showAdvancedImport ? "پنهان کردن ورود پیشرفته (با شماره ایستگاه)" : "ورود پیشرفته (با شماره ایستگاه) ›"}
          </button>

          {showAdvancedImport && (
            <form action={iAction} className="card p-5 flex flex-col gap-3">
              <h2 className="font-black">ورود با شماره‌ی ایستگاه</h2>
              <p className="text-xs text-muted leading-relaxed">ستون‌ها: <code dir="ltr" className="bg-soft px-1 rounded">stationId,type,prompt,options,correctIndex,answers,pairs,back,scenario,image,explanation,difficulty,tags</code> — شماره‌ی ایستگاه را از تب «نمای کلی» پیدا کنید.</p>
              <Msg s={iState} />
              <textarea name="csv" rows={8} dir="ltr" className={`${input} font-mono text-xs`} placeholder={`stationId,type,prompt,options,correctIndex,answers,pairs,back,scenario,image,explanation,difficulty,tags\n1,multiple_choice,"نسبت فشردن به تنفس؟","15:2|30:2|5:1|30:1",1,,,,,,"طبق AHA",1,"cpr"`} />
              <button disabled={iPending} className="btn btn-secondary self-start">{iPending ? "در حال ورود..." : "ورود سؤالات"}</button>
            </form>
          )}
        </div>
      )}

      {tab === "overview" && (
        <div className="flex flex-col gap-3">
          {categories.map((c) => (
            <details key={c.id} className="card p-4" open={false}>
              <summary className="cursor-pointer font-black inline-flex items-center gap-1.5" style={{ color: c.color }}><EmojiIcon name={c.icon} className="h-4 w-4" /> {c.title} <span className="text-xs text-muted font-bold">({toPersianDigits(topics.filter((t) => t.categoryId === c.id).length)} مبحث)</span></summary>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {topics.filter((t) => t.categoryId === c.id).map((t) => (
                  <li key={t.id}>
                    <p className="font-black">{t.title}</p>
                    <ul className="mr-4 mt-1 flex flex-wrap gap-2">
                      {stations.filter((s) => s.topicId === t.id).map((s) => <li key={s.id} className="inline-flex items-center gap-1.5 rounded-full border-2 border-soft px-3 py-1 text-xs font-bold"><EmojiIcon name={s.icon} className="h-4 w-4" /> {s.title} <span className="text-muted">#{s.id} • {toPersianDigits(s.count)} سؤال</span></li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}

      {tab === "students" && (
        <div className="card overflow-x-auto p-0">
          {students.length === 0 ? (
            <p className="p-5 text-sm text-muted">هنوز هیچ دانشجویی ثبت‌نام نکرده است.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-soft text-right text-xs text-muted">
                  <th className="p-3 font-black">دانشجو</th>
                  <th className="p-3 font-black">صحیح</th>
                  <th className="p-3 font-black">غلط</th>
                  <th className="p-3 font-black">درصد</th>
                  <th className="p-3 font-black">ایستگاه تکمیل‌شده</th>
                  <th className="p-3 font-black">استریک</th>
                  <th className="p-3 font-black"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-soft last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <AvatarIcon emoji={s.avatar} className="h-7 w-7" />
                        <div>
                          <p className="font-black">{s.name}</p>
                          <p className="text-xs text-muted" dir="ltr">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-[#58cc02]">{toPersianDigits(s.correctCount)}</td>
                    <td className="p-3 font-bold text-[#ff4b4b]">{toPersianDigits(s.wrongCount)}</td>
                    <td className="p-3 font-bold">{s.accuracyPct !== null ? `${toPersianDigits(s.accuracyPct)}٪` : "—"}</td>
                    <td className="p-3">{toPersianDigits(s.stationsCompleted)}</td>
                    <td className="p-3"><span className="inline-flex items-center gap-1"><FlameIcon className="h-4 w-4 text-orange-500" />{toPersianDigits(s.streak)}</span></td>
                    <td className="p-3">
                      <Link href={`/admin/students/${s.id}`} className="text-xs font-black text-[#2DD4BF] hover:underline">جزئیات ›</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
