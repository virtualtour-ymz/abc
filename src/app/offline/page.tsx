import { SignalIcon } from "@/components/icons/Icon";
export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <div className="flex justify-center text-[#2DD4BF]"><SignalIcon className="h-12 w-12" /></div>
        <h1 className="mt-4 text-2xl font-black">آفلاین هستید</h1>
        <p className="mt-2 text-muted">اتصال اینترنت برقرار نیست. سؤالات ذخیره‌شده اخیر در حافظه موجود است؛ پس از اتصال دوباره تلاش کنید.</p>
      </div>
    </main>
  );
}
