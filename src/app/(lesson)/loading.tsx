import { BookIcon } from "@/components/icons/Icon";
export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="text-center animate-pulse"><div className="flex justify-center text-[#2DD4BF]"><BookIcon className="h-12 w-12" /></div><p className="mt-3 font-black text-muted">در حال آماده‌سازی سؤالات...</p></div>
    </div>
  );
}
