import { requireUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { publicUser } from "@/lib/auth";

export const metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsForm user={publicUser(user)} />;
}
