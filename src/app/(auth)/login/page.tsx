import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/AuthForms";
export const metadata = { title: "ورود" };
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/learn");
  return <LoginForm />;
}
