"use client";
import { motion } from "framer-motion";

export function ProgressBar({
  value,
  color = "#58cc02",
  height = 16,
  className = "",
  track,
}: {
  value: number;
  color?: string;
  height?: number;
  className?: string;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full rounded-full overflow-hidden ${className}`} style={{ height, background: track ?? "var(--border)" }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className="h-full rounded-full progress-shine"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      />
    </div>
  );
}
