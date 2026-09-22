import { eq } from "drizzle-orm";
import { db } from "@/db";
import { powerUps } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { POWER_UPS } from "@/lib/gamification";
import { ShopClient } from "@/components/shop/ShopClient";

export const metadata = { title: "فروشگاه" };

export default async function ShopPage() {
  const user = await requireUser();
  const owned = await db.select().from(powerUps).where(eq(powerUps.userId, user.id));
  const qty = Object.fromEntries(owned.map((o) => [o.kind, o.quantity]));
  return <ShopClient gems={user.gems} items={POWER_UPS.map((p) => ({ ...p, owned: qty[p.kind] ?? 0 }))} />;
}
