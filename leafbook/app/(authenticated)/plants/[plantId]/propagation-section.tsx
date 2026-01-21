"use client";

import Link from "next/link";
import Image from "next/image";
import { GitBranch, Sprout, Leaf, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropagateDialog } from "./propagate-dialog";
import { SetParentDialog } from "./set-parent-dialog";

interface PlantSummary {
  id: string;
  name: string;
  nickname: string | null;
  active_photo_id: string | null;
}

interface ChildPlant extends PlantSummary {
  created_at: string;
}

interface PlantPhoto {
  id: string;
  plant_id: string;
  url: string;
}

interface PropagationSectionProps {
  plantId: string;
  plantName: string;
  plantTypeId: string | null;
  parentPlant: PlantSummary | null;
  childrenPlants: ChildPlant[];
  availablePlantsForParent: { id: string; name: string; nickname: string | null }[];
  // Map of plant_id -> photo URL for thumbnails
  photoMap: Map<string, string>;
}

function PlantCard({
  plant,
  photoUrl,
  badge,
}: {
  plant: PlantSummary;
  photoUrl: string | null;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={`/plants/${plant.id}`}
      className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      {/* Thumbnail */}
      {photoUrl ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-2 ring-background">
          <Image
            src={photoUrl}
            alt={plant.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="48px"
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Leaf className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-primary transition-colors">
          {plant.name}
        </p>
        {plant.nickname && (
          <p className="text-sm text-muted-foreground truncate italic">
            {plant.nickname}
          </p>
        )}
      </div>

      {/* Badge */}
      {badge}
    </Link>
  );
}

export function PropagationSection({
  plantId,
  plantName,
  plantTypeId,
  parentPlant,
  childrenPlants,
  availablePlantsForParent,
  photoMap,
}: PropagationSectionProps) {
  const hasParent = !!parentPlant;
  const hasChildren = childrenPlants.length > 0;
  const hasLineage = hasParent || hasChildren;

  return (
    <section>
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/5 to-transparent rounded-bl-full pointer-events-none" />

        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-serif">
                <GitBranch className="h-5 w-5 text-green-600" />
                Plant Lineage
              </CardTitle>
              <CardDescription>
                Track propagation relationships
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <SetParentDialog
                plantId={plantId}
                plantName={plantName}
                currentParentId={parentPlant?.id ?? null}
                currentParentName={parentPlant?.name ?? null}
                availablePlants={availablePlantsForParent}
              />
              <PropagateDialog
                parentPlantId={plantId}
                parentPlantName={plantName}
                parentPlantTypeId={plantTypeId}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Parent section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowUp className="h-4 w-4" />
              Parent
            </div>
            {hasParent ? (
              <PlantCard
                plant={parentPlant}
                photoUrl={photoMap.get(parentPlant.id) ?? null}
                badge={
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Sprout className="h-3 w-3" />
                    Mother
                  </Badge>
                }
              />
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No parent plant linked yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Was this plant propagated from another? Link it to track lineage.
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {plantName}
              </span>
            </div>
          </div>

          {/* Children section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ArrowDown className="h-4 w-4" />
                Children
                {hasChildren && (
                  <Badge variant="outline" className="ml-1">
                    {childrenPlants.length}
                  </Badge>
                )}
              </div>
            </div>
            {hasChildren ? (
              <div className="space-y-2">
                {childrenPlants.map((child) => (
                  <PlantCard
                    key={child.id}
                    plant={child}
                    photoUrl={photoMap.get(child.id) ?? null}
                    badge={
                      <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                        <Sprout className="h-3 w-3" />
                        Child
                      </Badge>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No propagations yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the Propagate button to create a cutting from this plant.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
