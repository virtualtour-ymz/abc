import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { Sidebar, BottomNav } from "@/components/shell/Nav";
import { StatsPanel } from "@/components/shell/StatsPanel";
import { MobileTopBar } from "@/components/shell/MobileTopBar";
import { PageTransition } from "@/components/ui/PageTransition";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <Sidebar isAdmin={user.role === "admin"} />
      <MobileTopBar streak={user.streak} gems={user.gems} xp={user.xp} />
      <main className="lg:mr-64 pb-24 lg:pb-8">
        <div className="mx-auto flex max-w-6xl gap-8 px-4 pt-4 lg:pt-8">
          <div className="flex-1 min-w-0"><PageTransition>{children}</PageTransition></div>
          <div className="hidden xl:block w-80 shrink-0 sticky top-8 self-start">
            <StatsPanel user={user} />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
