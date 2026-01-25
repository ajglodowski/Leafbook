"use client";

import { Archive, Calendar, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PlantWithTypes } from "@/lib/queries/plants";

interface LegacyPlantsListProps {
  plants: PlantWithTypes[];
  photosByPlant: Map<string, { id: string; url: string }[]>;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LegacyPlantsList({
  plants,
  photosByPlant,
}: LegacyPlantsListProps) {
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
        icon={Archive}
        title="No legacy plants"
        description="Legacy plants are those no longer in your active collection. When a plant passes on or is given away, you can mark it as legacy to preserve its history."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These plants are no longer in your active collection but their memories live on.
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {plants.map((plant) => {
          const plantType = Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types;
          const thumbnailUrl = getThumbnailUrl(plant.id, plant.active_photo_id);

          return (
            <Link key={plant.id} href={`/plants/${plant.id}`}>
              <Card className="gap-0 h-44 overflow-hidden transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md p-0 flex flex-row opacity-80 hover:opacity-100">
                {thumbnailUrl ? (
                  <div className="relative h-full w-32 sm:w-44 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={thumbnailUrl}
                      alt={plant.name}
                      fill
                      className="object-cover grayscale-[30%]"
                      sizes="(max-width: 640px) 128px, 176px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                ) : (
                  <div className="relative h-full w-32 sm:w-44 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                    <Leaf className="h-12 w-12 text-muted-foreground/40" />
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
                    <Badge variant="secondary" className="gap-1 shrink-0 my-auto bg-muted">
                      <Archive className="h-3 w-3" />
                      Legacy
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
                    
                    {/* Legacy info */}
                    {plant.legacy_reason && (
                      <p className="text-sm text-muted-foreground truncate">
                        {plant.legacy_reason}
                      </p>
                    )}
                    {plant.legacy_at && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatDate(plant.legacy_at)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
