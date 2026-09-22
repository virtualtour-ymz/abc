// Client-safe constants (no DB imports)
export const XP = {
  CORRECT: 10,
  QUICK_BONUS: 5,
  STREAK_DAY: 5,
  WEEKLY_BONUS: 50,
  PERFECT_LESSON: 20,
  QUICK_THRESHOLD_MS: 5000,
} as const;

export const LEAGUES = [
  { key: "bronze", title: "برنز", min: 0, icon: "🥉", color: "#cd7f32" },
  { key: "silver", title: "نقره", min: 500, icon: "🥈", color: "#9ca3af" },
  { key: "gold", title: "طلا", min: 1500, icon: "🥇", color: "#f59e0b" },
  { key: "diamond", title: "الماس", min: 3000, icon: "💎", color: "#38bdf8" },
] as const;
export type League = (typeof LEAGUES)[number];
export type LeagueKey = League["key"];

export function leagueForXp(xp: number): League {
  let current: League = LEAGUES[0];
  for (const l of LEAGUES) if (xp >= l.min) current = l;
  return current;
}
export function nextLeague(xp: number): League | null {
  return LEAGUES.find((l) => l.min > xp) ?? null;
}
export function leagueInfo(key: string): League {
  return LEAGUES.find((l) => l.key === key) ?? LEAGUES[0];
}

export const POWER_UPS = [
  { kind: "streak_freeze", title: "محافظ استریک", description: "یک روز غیبت، استریک شما را نمی‌شکند", icon: "🧊", price: 200 },
  { kind: "double_xp", title: "XP دوبرابر", description: "درس بعدی دو برابر امتیاز می‌دهد", icon: "⚡", price: 150 },
  { kind: "hint", title: "راهنما", description: "حذف دو گزینه اشتباه در سؤالات چهارگزینه‌ای", icon: "💡", price: 50 },
] as const;
export type PowerUpKind = (typeof POWER_UPS)[number]["kind"];
