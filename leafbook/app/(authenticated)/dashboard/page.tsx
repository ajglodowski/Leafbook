import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  CareTasksSkeleton,
  DashboardHeaderSkeleton,
  RecentJournalSkeleton,
  SpotlightActionsSkeleton,
  UpcomingWaterSkeleton,
} from "@/app/(authenticated)/dashboard/dashboard-loading";
import { getCurrentUserId } from "@/lib/supabase/server";

import { CareTasksSection } from "./care-tasks-section";
import { DashboardHeader } from "./dashboard-header";
import { EmptyStateSection } from "./empty-state-section";
import { RecentJournalSection } from "./recent-journal-section";
import { ScheduleSuggestionsSection } from "./schedule-suggestions-section";
import { SpotlightAndActionsSection } from "./spotlight-actions-section";
import { UpcomingWaterSection } from "./upcoming-water-section";

export const metadata = {
  title: "Today | Leafbook",
  description: "Your daily plant care overview",
};

function TodayDashboard({ userId }: { userId: string }) {
  if (!userId) {
    return null;
  }

  return (
    <div className="space-y-8">
      <Suspense fallback={<DashboardHeaderSkeleton />}>
        <DashboardHeader userId={userId} />
      </Suspense>
      <Suspense fallback={null}>
        <ScheduleSuggestionsSection userId={userId} />
      </Suspense>
      <Suspense fallback={<CareTasksSkeleton />}>
        <CareTasksSection userId={userId} />
      </Suspense>
      <Suspense fallback={<UpcomingWaterSkeleton />}>
        <UpcomingWaterSection userId={userId} />
      </Suspense>
      <Suspense fallback={<SpotlightActionsSkeleton />}>
        <SpotlightAndActionsSection userId={userId} />
      </Suspense>
      <Suspense fallback={<RecentJournalSkeleton />}>
        <RecentJournalSection userId={userId} />
      </Suspense>
      <Suspense fallback={null}>
        <EmptyStateSection userId={userId} />
      </Suspense>
    </div>
  );
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return <TodayDashboard userId={userId} />;
}
