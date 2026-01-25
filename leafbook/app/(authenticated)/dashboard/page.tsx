import { redirect } from "next/navigation";

import { TodayDashboard } from "@/app/(authenticated)/dashboard/today-dashboard";
import { getCurrentUserId } from "@/lib/supabase/server";

export const metadata = {
  title: "Today | Leafbook",
  description: "Your daily plant care overview",
};

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return <TodayDashboard userId={userId} />;
}
