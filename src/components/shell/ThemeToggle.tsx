"use client";

/**
 * The app now ships a single dark "medical" theme, so the light/dark toggle
 * is intentionally disabled. Kept as a no-op component so existing imports
 * (Nav, Settings) don't break; it can be removed entirely once those call
 * sites are cleaned up.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  return null;
}
