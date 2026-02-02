import { Camera, PenLine } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { QuickActionsPanel } from "@/app/(authenticated)/dashboard/quick-actions-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getDashboardPlantCount, getDashboardSpotlightPlants } from "./today-dashboard-data";
import {
  getSpotlightMessage,
  type SpotlightPlant,
} from "./today-dashboard-utils";

export async function SpotlightAndActionsSection({ userId }: { userId: string }) {
  const [{ count: plantCount }, { data: plantsForSpotlight }] = await Promise.all([
    getDashboardPlantCount(userId),
    getDashboardSpotlightPlants(userId),
  ]);

  const hasPlants = plantCount !== null && plantCount > 0;
  if (!hasPlants) {
    return null;
  }

  const spotlightPlant: SpotlightPlant | null =
    plantsForSpotlight && plantsForSpotlight.length > 0
      ? (() => {
          const dayIndex = new Date().getDate() % plantsForSpotlight.length;
          const plant = plantsForSpotlight[dayIndex];
          const plantType = Array.isArray(plant.plant_types)
            ? plant.plant_types[0]
            : plant.plant_types;
          const photos = plant.plant_photos as { url: string }[] | null;
          return {
            id: plant.id,
            name: plant.name,
            nickname: plant.nickname,
            description: plant.description,
            how_acquired: plant.how_acquired,
            plant_type_name: plantType?.name || null,
            photo_url: photos && photos.length > 0 ? photos[0].url : null,
          };
        })()
      : null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {spotlightPlant && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-muted-foreground" />
              Plant Spotlight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground italic">
              {getSpotlightMessage(spotlightPlant)}
            </p>
            <div className="flex gap-3">
              {spotlightPlant.photo_url && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={spotlightPlant.photo_url}
                    alt={spotlightPlant.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/plants/${spotlightPlant.id}`}
                  className="font-serif text-lg font-semibold hover:text-primary transition-colors"
                >
                  {spotlightPlant.name}
                </Link>
                {spotlightPlant.plant_type_name && (
                  <p className="text-sm text-muted-foreground">
                    {spotlightPlant.plant_type_name}
                  </p>
                )}
                {spotlightPlant.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {spotlightPlant.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Link href={`/plants/${spotlightPlant.id}`}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
              <Link href={`/plants/${spotlightPlant.id}#journal`}>
                <Button size="sm" variant="ghost">
                  <PenLine className="mr-1.5 h-3.5 w-3.5" />
                  Write
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <QuickActionsPanel />
    </div>
  );
}
