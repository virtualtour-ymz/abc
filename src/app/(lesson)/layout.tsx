import type { ReactNode } from "react";
export const dynamic = "force-dynamic";
export default function LessonLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
