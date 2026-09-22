import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/AuthForms";
export const metadata = { title: "ثبت‌نام" };
export const dynamic = "force-dynamic";
export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/learn");
  return <RegisterForm />;
}
