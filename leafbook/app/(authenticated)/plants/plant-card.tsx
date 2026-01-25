"use client";

import { Droplets, Home, MapPin, Sparkles, TreePine } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PlantDueTask, PlantTypeSummary, PlantWithTypes } from "@/lib/queries/plants";

interface PlantCardProps {
  plant: PlantWithTypes;
  plantType?: PlantTypeSummary;
  taskStatus?: PlantDueTask;
  thumbnailUrl: string | null;
}

export function PlantCard({ plant, plantType, taskStatus, thumbnailUrl }: PlantCardProps) {
  const needsWater =
    taskStatus?.watering_status === "overdue" || taskStatus?.watering_status === "due_soon";
  const needsFertilizer =
    taskStatus?.fertilizing_status === "overdue" || taskStatus?.fertilizing_status === "due_soon";

  return (
    <Link href={`/plants/${plant.id}`}>
      <Card className="gap-0 h-44 overflow-hidden transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md p-0 flex flex-row">
        {thumbnailUrl && (
          <div className="relative h-full w-32 sm:w-44 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image
              src={thumbnailUrl}
              alt={plant.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 128px, 176px"
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
                    variant={
                      taskStatus?.fertilizing_status === "overdue" ? "destructive" : "outline"
                    }
                    className="gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    {taskStatus?.fertilizing_status === "overdue"
                      ? "Needs fertilizer"
                      : "Fertilize soon"}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
