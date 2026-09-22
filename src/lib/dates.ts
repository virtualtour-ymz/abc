import { toJalaali } from "jalaali-js";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

/** Convert any number/string digits to Persian digits. */
export function toPersianDigits(input: number | string): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Format a number with Persian digits and thousands separators. */
export function formatNumber(n: number): string {
  return toPersianDigits(new Intl.NumberFormat("en-US").format(Math.round(n)));
}

/** YYYY-MM-DD in local time (used for streak tracking). */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return c;
}

/** ISO week key like 2025-W12 and month key like 2025-03. */
export function periodKeys(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return {
    week: `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`,
    month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
  };
}

/** Full Jalali date string e.g. «سه‌شنبه ۱۲ فروردین ۱۴۰۴». */
export function formatJalali(d: Date | string, withWeekday = true): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const { jy, jm, jd } = toJalaali(date);
  const base = `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
  return withWeekday ? `${WEEKDAYS[date.getDay()]} ${base}` : base;
}

export function formatJalaliShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const { jy, jm, jd } = toJalaali(date);
  return toPersianDigits(`${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`);
}

export function jalaliMonthDay(d: Date): string {
  const { jm, jd } = toJalaali(d);
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`;
}

export function weekdayShort(d: Date): string {
  return ["ی", "د", "س", "چ", "پ", "ج", "ش"][d.getDay()];
}

export function relativeTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "همین الان";
  if (min < 60) return `${toPersianDigits(min)} دقیقه پیش`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${toPersianDigits(h)} ساعت پیش`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${toPersianDigits(days)} روز پیش`;
  return formatJalali(date, false);
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${toPersianDigits(m)}:${toPersianDigits(String(sec).padStart(2, "0"))}`;
}
