import { Clock, Droplets, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CareButton } from "@/app/(authenticated)/today/care-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPlantPhotosForPlants } from "@/lib/queries/plants";

import { getDashboardDueTasks } from "./today-dashboard-data";
import {
  buildPhotosByPlant,
  getDaysUntilDue,
  getThumbnailUrl,
  type PlantTask,
  type UpcomingTask,
} from "./today-dashboard-utils";

export async function UpcomingWaterSection({ userId }: { userId: string }) {
  const { data: dueTasks } = await getDashboardDueTasks(userId);

  const upcomingWater: UpcomingTask[] =
    (dueTasks
      ?.filter((t: PlantTask) => {
        if (t.watering_status !== "ok" || !t.water_due_at) return false;
        const daysUntil = getDaysUntilDue(t.water_due_at);
        return daysUntil > 0 && daysUntil <= 7;
      })
      .map((t: PlantTask) => ({
        ...t,
        days_until_water: getDaysUntilDue(t.water_due_at),
      })) || [])
      .sort((a, b) => a.days_until_water - b.days_until_water);

  if (upcomingWater.length === 0) {
    return null;
  }

  const plantIds = Array.from(
    new Set(upcomingWater.map((task) => task.plant_id).filter(Boolean))
  );
  const { data: plantPhotos } = await getPlantPhotosForPlants(plantIds);
  const photosByPlant = buildPhotosByPlant(plantPhotos);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <Clock className="h-5 w-5 text-blue-500" />
          Coming Up This Week
        </h2>
        <Badge variant="secondary" className="gap-1">
          <Droplets className="h-3 w-3" />
          {upcomingWater.length} upcoming
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Droplets className="h-4 w-4 text-blue-400" />
          Water soon
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingWater.slice(0, 6).map((task) => {
            const thumbnailUrl = getThumbnailUrl(task.plant_id, photosByPlant);
            return (
              <Card
                key={`upcoming-${task.plant_id}`}
                size="sm"
                className="group border-blue-200/50 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/20"
              >
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
                        {task.days_until_water === 1
                          ? "Water tomorrow"
                          : `Water in ${task.days_until_water} days`}
                      </p>
                    </div>
                  </div>
                  <CareButton plantId={task.plant_id!} eventType="watered" variant="water" />
                </CardContent>
              </Card>
            );
          })}
        </div>
        {upcomingWater.length > 6 && (
          <p className="text-sm text-muted-foreground">
            +{upcomingWater.length - 6} more plants need water this week
          </p>
        )}
      </div>
    </section>
  );
}
