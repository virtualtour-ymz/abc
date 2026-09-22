import Link from "next/link";
import { SearchIcon } from "@/components/icons/Icon";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <div className="flex justify-center text-[#2DD4BF]"><SearchIcon className="h-14 w-14" /></div>
        <h1 className="mt-4 text-2xl font-black">صفحه پیدا نشد</h1>
        <Link href="/learn" className="btn btn-primary mt-6">بازگشت به خانه</Link>
      </div>
    </main>
  );
}
