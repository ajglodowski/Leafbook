import { redirect } from "next/navigation";
import { TodayDashboard } from "@/components/today-dashboard";
import { getCurrentUserId } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return <TodayDashboard userId={userId} />;
}
