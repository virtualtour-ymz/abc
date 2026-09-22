export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-36 rounded-3xl bg-[var(--border)]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-[var(--border)]" />)}
      </div>
    </div>
  );
}
