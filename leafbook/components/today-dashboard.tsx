import Link from "next/link";
import { CalendarCheck, Droplets, Sparkles, Check, Leaf } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CareButton } from "@/app/(authenticated)/today/care-button";

type TaskStatus = "overdue" | "due_soon" | "not_started" | "ok";

interface PlantTask {
  plant_id: string;
  plant_name: string;
  plant_type_name: string | null;
  watering_status: TaskStatus;
  watering_frequency_days: number;
  last_watered_at: string | null;
  fertilizing_status: TaskStatus;
  fertilizing_frequency_days: number;
  last_fertilized_at: string | null;
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? "s" : ""} ago`;
}

export async function TodayDashboard({ userId }: { userId: string }) {
  if (!userId) {
    return null;
  }

  const supabase = await createClient();

  // Fetch due tasks for user's plants
  const { data: dueTasks, error } = await supabase
    .from("v_plant_due_tasks")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching due tasks:", error);
  }

  // Separate into categories
  const needsWater = dueTasks?.filter(
    (t: PlantTask) =>
      t.watering_status === "overdue" ||
      t.watering_status === "due_soon" ||
      t.watering_status === "not_started"
  ) || [];

  const needsFertilizer = dueTasks?.filter(
    (t: PlantTask) => t.fertilizing_status === "overdue" || t.fertilizing_status === "due_soon"
  ) || [];

  const allCaughtUp = needsWater.length === 0 && needsFertilizer.length === 0;
  const hasPlants = dueTasks && dueTasks.length > 0;

  // Count stats
  const overdueWaterCount = needsWater.filter((t: PlantTask) => t.watering_status === "overdue").length;
  const dueSoonWaterCount = needsWater.filter((t: PlantTask) => t.watering_status === "due_soon").length;
  const notStartedCount = needsWater.filter((t: PlantTask) => t.watering_status === "not_started").length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-muted-foreground">
          {allCaughtUp && hasPlants ? "All your plants are happy!" : "Your plants' care tasks at a glance"}
        </p>
      </div>

      {/* Stats summary */}
      {hasPlants && (
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <Leaf className="h-4 w-4" />
            {dueTasks.length} plant{dueTasks.length !== 1 ? "s" : ""}
          </Badge>
          {overdueWaterCount > 0 && (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1.5">
              <Droplets className="h-4 w-4" />
              {overdueWaterCount} need{overdueWaterCount === 1 ? "s" : ""} water
            </Badge>
          )}
          {dueSoonWaterCount > 0 && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Droplets className="h-4 w-4" />
              {dueSoonWaterCount} due soon
            </Badge>
          )}
          {notStartedCount > 0 && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              {notStartedCount} not yet tracked
            </Badge>
          )}
        </div>
      )}

      {/* Watering tasks */}
      {needsWater.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-medium">
            <Droplets className="h-5 w-5 text-blue-500" />
            Watering
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {needsWater.map((task: PlantTask) => (
              <Card key={`water-${task.plant_id}`} size="sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        <Link href={`/plants/${task.plant_id}`} className="hover:text-primary hover:underline">
                          {task.plant_name}
                        </Link>
                      </CardTitle>
                      {task.plant_type_name && (
                        <p className="text-xs text-muted-foreground truncate">{task.plant_type_name}</p>
                      )}
                    </div>
                    <Badge
                      variant={task.watering_status === "overdue" ? "destructive" : "outline"}
                      className="shrink-0"
                    >
                      {task.watering_status === "overdue"
                        ? "Overdue"
                        : task.watering_status === "not_started"
                          ? "Not tracked"
                          : "Due soon"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Last: {formatTimeAgo(task.last_watered_at)}</p>
                  <CareButton plantId={task.plant_id!} eventType="watered" variant="water" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Fertilizing tasks */}
      {needsFertilizer.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-medium">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Fertilizing
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {needsFertilizer.map((task: PlantTask) => (
              <Card key={`fert-${task.plant_id}`} size="sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        <Link href={`/plants/${task.plant_id}`} className="hover:text-primary hover:underline">
                          {task.plant_name}
                        </Link>
                      </CardTitle>
                      {task.plant_type_name && (
                        <p className="text-xs text-muted-foreground truncate">{task.plant_type_name}</p>
                      )}
                    </div>
                    <Badge
                      variant={task.fertilizing_status === "overdue" ? "destructive" : "outline"}
                      className="shrink-0"
                    >
                      {task.fertilizing_status === "overdue" ? "Overdue" : "Due soon"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Last: {formatTimeAgo(task.last_fertilized_at)}</p>
                  <CareButton plantId={task.plant_id!} eventType="fertilized" variant="fertilize" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* All caught up state */}
      {allCaughtUp && hasPlants && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">All caught up!</p>
              <p className="text-sm text-muted-foreground">
                Your plants are well cared for. Check back later for new tasks.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No plants state */}
      {!hasPlants && (
        <EmptyState
          icon={CalendarCheck}
          title="No plants to track yet"
          description="Add your first plant to start tracking care tasks. No chores here — just gentle reminders when your plants need attention."
        >
          <Button render={<Link href="/plants" />}>Add your first plant</Button>
        </EmptyState>
      )}
    </div>
  );
}
