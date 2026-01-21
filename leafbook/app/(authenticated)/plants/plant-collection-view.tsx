"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Droplets, Home, Leaf, MapPin, Sparkles, TreePine } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddPlantDialog } from "./add-plant-dialog";
import type { PlantWithTypes, PlantDueTask, PlantTypeSummary } from "@/lib/queries/plants";

interface PlantCollectionViewProps {
  plants: PlantWithTypes[];
  plantTypes: PlantTypeSummary[];
  dueTasks: PlantDueTask[];
  photosByPlant: Map<string, { id: string; url: string }[]>;
}

export function PlantCollectionView({
  plants,
  plantTypes,
  dueTasks,
  photosByPlant,
}: PlantCollectionViewProps) {
  // Create a map for quick lookup
  const dueTaskMap = new Map(
    dueTasks?.map(task => [task.plant_id, task]) || []
  );

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

  const hasPlants = plants && plants.length > 0;

  if (!hasPlants) {
    return (
      <EmptyState
        icon={Leaf}
        title="No plants yet"
        description="Start building your collection! Add a plant from the catalog or create one with a custom name."
      >
        <div className="flex gap-3">
          <Link href="/plant-types">
            <Button variant="outline">
              Browse catalog
            </Button>
          </Link>
          <AddPlantDialog plantTypes={plantTypes || []} />
        </div>
      </EmptyState>
    );
  }

  return (
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
  );
}
