import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PwaRegister } from "@/components/shell/PwaRegister";

export const metadata: Metadata = {
  title: { default: "پرستاریار — یادگیری پرستاری به سبک دولینگو", template: "%s | پرستاریار" },
  description: "آموزش گام‌به‌گام پرستاری با سؤالات تعاملی، امتیاز، استریک و لیگ‌های رقابتی",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "پرستاریار", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" />
      </head>
      <body className="antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
