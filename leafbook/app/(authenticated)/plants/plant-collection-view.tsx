"use client";

import { Leaf } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import type { PlantDueTask, PlantTypeSummary,PlantWithTypes } from "@/lib/queries/plants";

import { AddPlantDialog } from "./add-plant-dialog";
import { PlantCard } from "./plant-card";

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
          <AddPlantDialog
            plantTypes={plantTypes || []}
            plants={plants.map((plant) => ({
              id: plant.id,
              name: plant.name,
              nickname: plant.nickname,
            }))}
          />
        </div>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plants.map((plant) => {
        const plantType = Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types;
        const taskStatus = dueTaskMap.get(plant.id);
        const thumbnailUrl = getThumbnailUrl(plant.id, plant.active_photo_id);

        return (
          <PlantCard
            key={plant.id}
            plant={plant}
            plantType={plantType || undefined}
            taskStatus={taskStatus}
            thumbnailUrl={thumbnailUrl}
          />
        );
      })}
    </div>
  );
}
