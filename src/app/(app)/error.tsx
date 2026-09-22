"use client";
import { BandageIcon } from "@/components/icons/Icon";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card p-10 text-center">
      <div className="flex justify-center text-[#2DD4BF]"><BandageIcon className="h-14 w-14" /></div>
      <h2 className="mt-4 text-xl font-black">مشکلی پیش آمد</h2>
      <p className="mt-2 text-sm text-muted">لطفاً دوباره تلاش کنید.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-5">تلاش مجدد</button>
    </div>
  );
}
