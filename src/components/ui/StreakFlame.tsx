import { FlameIcon } from "@/components/icons/Icon";

const SIZES: Record<string, string> = {
  "text-xl": "h-5 w-5",
  "text-2xl": "h-6 w-6",
  "text-3xl": "h-8 w-8",
};

export function StreakFlame({ active, size = "text-2xl" }: { active: boolean; size?: string }) {
  return (
    <span className={`inline-block ${active ? "animate-flame text-orange-500" : "grayscale opacity-50 text-muted"}`} aria-hidden>
      <FlameIcon className={SIZES[size] ?? "h-6 w-6"} />
    </span>
  );
}
