import { BookOpen, Camera, Droplets, Leaf, Lightbulb, Sprout } from "lucide-react";

import { QuickActionsPanel } from "@/app/(authenticated)/dashboard/quick-actions-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-9 w-60" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function ScheduleSuggestionsSkeleton() {
  return (
    <Card className="border-purple-200/50 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-950/20">
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
            <Lightbulb className="h-4 w-4 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-9 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CareTasksSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <Sprout className="h-5 w-5 text-primary" />
          Needs Attention
        </h2>
        <Badge variant="destructive" className="gap-1">
          <Droplets className="h-3 w-3" />
          <Skeleton className="h-3 w-10" />
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Droplets className="h-4 w-4 text-blue-500" />
          Water
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} size="sm" className="group">
              <CardContent className="flex items-center justify-between gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-12 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UpcomingWaterSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <Droplets className="h-5 w-5 text-blue-500" />
          Coming Up This Week
        </h2>
        <Badge variant="secondary" className="gap-1">
          <Droplets className="h-3 w-3" />
          <Skeleton className="h-3 w-10" />
        </Badge>
      </div>
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Droplets className="h-4 w-4 text-blue-400" />
          Water soon
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              size="sm"
              className="group border-blue-200/50 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/20"
            >
              <CardContent className="flex items-center justify-between gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-12 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SpotlightActionsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4 text-muted-foreground" />
            Plant Spotlight
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-44" />
          <div className="flex gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-24" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </CardContent>
      </Card>
      <QuickActionsPanel />
    </div>
  );
}

export function RecentJournalSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          Recent Journal Entries
        </h2>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="group">
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="mt-2 h-4 w-36" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-3/4" />
                </div>
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function EmptyStateSkeleton() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Leaf className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <Skeleton className="mx-auto h-5 w-48" />
          <Skeleton className="mx-auto h-4 w-[280px]" />
          <Skeleton className="mx-auto h-4 w-[240px]" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <DashboardHeaderSkeleton />
      <CareTasksSkeleton />
      <UpcomingWaterSkeleton />
      <SpotlightActionsSkeleton />
      <RecentJournalSkeleton />
    </div>
  );
}
