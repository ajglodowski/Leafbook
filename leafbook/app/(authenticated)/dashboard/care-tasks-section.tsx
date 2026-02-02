import { Check, Droplets, Leaf, Sparkles, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CareButton } from "@/app/(authenticated)/today/care-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPlantPhotosForPlants } from "@/lib/queries/plants";

import { getDashboardDueTasks, getDashboardPlantCount } from "./today-dashboard-data";
import {
  buildPhotosByPlant,
  formatTimeAgo,
  getThumbnailUrl,
  type PlantTask,
} from "./today-dashboard-utils";

export async function CareTasksSection({ userId }: { userId: string }) {
  const [{ data: dueTasks, error: dueTasksError }, { count: plantCount }] =
    await Promise.all([getDashboardDueTasks(userId), getDashboardPlantCount(userId)]);

  if (dueTasksError) {
    console.error("Error fetching due tasks:", dueTasksError);
  }

  const plantIds = Array.from(
    new Set((dueTasks || []).map((task: PlantTask) => task.plant_id).filter(Boolean))
  );
  const { data: plantPhotos } = await getPlantPhotosForPlants(plantIds);
  const photosByPlant = buildPhotosByPlant(plantPhotos);

  const needsWater =
    dueTasks?.filter(
      (t: PlantTask) =>
        t.watering_status === "overdue" ||
        t.watering_status === "due_soon" ||
        t.watering_status === "not_started"
    ) || [];

  const needsFertilizer =
    dueTasks?.filter(
      (t: PlantTask) =>
        t.fertilizing_status === "overdue" || t.fertilizing_status === "due_soon"
    ) || [];

  const totalCareTasks = needsWater.length + needsFertilizer.length;
  const overdueWaterCount = needsWater.filter(
    (t: PlantTask) => t.watering_status === "overdue"
  ).length;
  const hasPlants = plantCount !== null && plantCount > 0;
  const allCaughtUp = totalCareTasks === 0 && hasPlants;

  if (totalCareTasks === 0 && !allCaughtUp) {
    return null;
  }

  if (allCaughtUp) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-700 dark:text-green-400">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              Your plants are well cared for. Maybe write a journal entry?
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <Sprout className="h-5 w-5 text-primary" />
          Needs Attention
        </h2>
        {overdueWaterCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <Droplets className="h-3 w-3" />
            {overdueWaterCount} thirsty
          </Badge>
        )}
      </div>

      {needsWater.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Droplets className="h-4 w-4 text-blue-500" />
            Water
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {needsWater.slice(0, 6).map((task: PlantTask) => {
              const thumbnailUrl = getThumbnailUrl(task.plant_id, photosByPlant);
              return (
                <Card key={`water-${task.plant_id}`} size="sm" className="group">
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {thumbnailUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={thumbnailUrl}
                            alt={task.plant_name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Leaf className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/plants/${task.plant_id}`}
                          className="font-medium truncate block hover:text-primary transition-colors"
                        >
                          {task.plant_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {task.watering_status === "overdue"
                            ? `${formatTimeAgo(task.last_watered_at)}`
                            : task.watering_status === "not_started"
                              ? "Not tracked yet"
                              : "Due soon"}
                        </p>
                      </div>
                    </div>
                    <CareButton plantId={task.plant_id!} eventType="watered" variant="water" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {needsWater.length > 6 && (
            <p className="text-sm text-muted-foreground">
              +{needsWater.length - 6} more plants need water
            </p>
          )}
        </div>
      )}

      {needsFertilizer.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Fertilize
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {needsFertilizer.slice(0, 3).map((task: PlantTask) => {
              const thumbnailUrl = getThumbnailUrl(task.plant_id, photosByPlant);
              return (
                <Card key={`fert-${task.plant_id}`} size="sm" className="group">
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {thumbnailUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={thumbnailUrl}
                            alt={task.plant_name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Leaf className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/plants/${task.plant_id}`}
                          className="font-medium truncate block hover:text-primary transition-colors"
                        >
                          {task.plant_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {task.fertilizing_status === "overdue" ? "Overdue" : "Due soon"}
                        </p>
                      </div>
                    </div>
                    <CareButton plantId={task.plant_id!} eventType="fertilized" variant="fertilize" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {needsFertilizer.length > 3 && (
            <p className="text-sm text-muted-foreground">
              +{needsFertilizer.length - 3} more plants need fertilizer
            </p>
          )}
        </div>
      )}
    </section>
  );
}
