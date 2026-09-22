import { ResetForm } from "@/components/auth/AuthForms";
export const metadata = { title: "رمز عبور جدید" };
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <ResetForm token={token ?? ""} />;
}
