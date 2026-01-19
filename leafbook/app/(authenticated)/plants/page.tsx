import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Droplets, Home, Leaf, MapPin, Sparkles, TreePine } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getCurrentUser,
  getDueTasksForUser,
  getPlantPhotosForPlants,
  getPlantsForUser,
  getPlantTypes,
} from "./actions";
import { AddPlantDialog } from "./add-plant-dialog";

export default async function PlantsPage() {
  const user = await getCurrentUser();
  const [plantsResult, plantTypesResult, dueTasksResult] = await Promise.all([
    getPlantsForUser(user.id),
    getPlantTypes(),
    getDueTasksForUser(user.id),
  ]);
  const plants = plantsResult.data;
  const plantTypes = plantTypesResult.data;
  const dueTasks = dueTasksResult.data;

  // Create a map for quick lookup
  const dueTaskMap = new Map(
    dueTasks?.map(task => [task.plant_id, task]) || []
  );

  // Fetch all photos for the user's plants (for thumbnails)
  const plantIds = plants?.map(p => p.id) || [];
  const { data: allPhotos } = await getPlantPhotosForPlants(plantIds);

  // Build a map of plant_id -> photos (ordered by taken_at desc)
  const photosByPlant = new Map<string, { id: string; url: string }[]>();
  allPhotos?.forEach(photo => {
    const existing = photosByPlant.get(photo.plant_id) || [];
    existing.push({ id: photo.id, url: photo.url });
    photosByPlant.set(photo.plant_id, existing);
  });

  // Helper to get thumbnail URL for a plant
  function getThumbnailUrl(plantId: string, activePhotoId: string | null): string | null {
    const photos = photosByPlant.get(plantId);
    if (!photos || photos.length === 0) return null;
    
    // If active photo is set, find it
    if (activePhotoId) {
      const activePhoto = photos.find(p => p.id === activePhotoId);
      if (activePhoto) return activePhoto.url;
    }
    
    // Fallback to most recent photo (first in the list since ordered by taken_at desc)
    return photos[0].url;
  }

  if (plantsResult.error) {
    console.error("Error fetching plants:", plantsResult.error);
  }

  const hasPlants = plants && plants.length > 0;
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">My Plants</h1>
          <p className="mt-1 text-muted-foreground">
            Your personal plant collection
            {hasPlants && ` · ${plants.length} plant${plants.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <AddPlantDialog plantTypes={plantTypes || []} />
      </div>

      {/* Plants grid */}
      {hasPlants ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {plants.map((plant) => {
            const plantType = Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types;
            const taskStatus = dueTaskMap.get(plant.id);
            const needsWater = taskStatus?.watering_status === "overdue" || taskStatus?.watering_status === "due_soon";
            const needsFertilizer = taskStatus?.fertilizing_status === "overdue" || taskStatus?.fertilizing_status === "due_soon";
            const thumbnailUrl = getThumbnailUrl(plant.id, plant.active_photo_id);

            return (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <Card className="gap-0 h-44 overflow-hidden transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md p-0 flex flex-row">
                  {thumbnailUrl && (
                    <div className="relative h-full aspect-square shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={thumbnailUrl}
                        alt={plant.name}
                        fill
                        className="object-cover"
                        sizes="176px"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-serif text-lg font-medium">{plant.name}</h3>
                        {plant.nickname && (
                          <p className="text-sm text-muted-foreground truncate">"{plant.nickname}"</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="gap-1 shrink-0 my-auto">
                        {plant.plant_location === "indoor" ? (
                          <>
                            <Home className="h-3 w-3" />
                            Indoor
                          </>
                        ) : (
                          <>
                            <TreePine className="h-3 w-3" />
                            Outdoor
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      {plantType && (
                        <p className="text-sm text-muted-foreground">
                          {plantType.name}
                          {plantType.scientific_name && (
                            <span className="italic"> · {plantType.scientific_name}</span>
                          )}
                        </p>
                      )}
                      {plant.location && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {plant.location}
                        </p>
                      )}
                      
                      {/* Care status indicators */}
                      {(needsWater || needsFertilizer) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {needsWater && (
                            <Badge 
                              variant={taskStatus?.watering_status === "overdue" ? "destructive" : "outline"}
                              className="gap-1"
                            >
                              <Droplets className="h-3 w-3" />
                              {taskStatus?.watering_status === "overdue" ? "Needs water" : "Water soon"}
                            </Badge>
                          )}
                          {needsFertilizer && (
                            <Badge 
                              variant={taskStatus?.fertilizing_status === "overdue" ? "destructive" : "outline"}
                              className="gap-1"
                            >
                              <Sparkles className="h-3 w-3" />
                              {taskStatus?.fertilizing_status === "overdue" ? "Needs fertilizer" : "Fertilize soon"}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Leaf}
          title="No plants yet"
          description="Start building your collection! Add a plant from the catalog or create one with a custom name."
        >
          <div className="flex gap-3">
            <Button variant="outline" render={<Link href="/plant-types" />}>
              Browse catalog
            </Button>
            <AddPlantDialog plantTypes={plantTypes || []} />
          </div>
        </EmptyState>
      )}
    </div>
  );
}
