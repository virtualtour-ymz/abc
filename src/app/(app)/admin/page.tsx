import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getAdminTree } from "@/lib/actions";
import { getStudentRoster } from "@/lib/teacher-stats";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata = { title: "پنل مدیریت" };

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/learn");
  const { cats, tps, sts, counts } = await getAdminTree();
  const countMap = Object.fromEntries(counts.map((c) => [c.stationId, c.n]));
  const students = await getStudentRoster();
  return (
    <AdminPanel
      categories={cats.map((c) => ({ id: c.id, title: c.title, color: c.color, icon: c.icon }))}
      topics={tps.map((t) => ({ id: t.id, categoryId: t.categoryId, title: t.title }))}
      stations={sts.map((s) => ({ id: s.id, topicId: s.topicId, title: s.title, icon: s.icon, count: countMap[s.id] ?? 0 }))}
      students={students}
    />
  );
}
