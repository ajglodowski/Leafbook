"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GitBranch, Sprout, Leaf, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  compact = false,
}: {
  plant: PlantSummary;
  photoUrl: string | null;
  badge?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/plants/${plant.id}`}
      className={`group flex items-center gap-3 ${compact ? "p-2" : "p-3"} rounded-lg border bg-card hover:bg-accent/50 transition-colors`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Thumbnail */}
      {photoUrl ? (
        <div className={`relative ${compact ? "h-8 w-8" : "h-12 w-12"} shrink-0 overflow-hidden rounded-lg bg-muted ring-2 ring-background`}>
          <Image
            src={photoUrl}
            alt={plant.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={compact ? "32px" : "48px"}
          />
        </div>
      ) : (
        <div className={`flex ${compact ? "h-8 w-8" : "h-12 w-12"} shrink-0 items-center justify-center rounded-lg bg-muted`}>
          <Leaf className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-muted-foreground`} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate group-hover:text-primary transition-colors ${compact ? "text-sm" : ""}`}>
          {plant.name}
        </p>
        {!compact && plant.nickname && (
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
  const [isOpen, setIsOpen] = useState(false);
  const hasParent = !!parentPlant;
  const hasChildren = childrenPlants.length > 0;
  const hasLineage = hasParent || hasChildren;

  return (
    <section>
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/5 to-transparent rounded-bl-full pointer-events-none" />

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div
                className="flex items-center justify-between gap-3 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsOpen((prev) => !prev);
                  }
                }}
                aria-label={isOpen ? "Collapse plant lineage" : "Expand plant lineage"}
              >
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg font-serif">
                    <GitBranch className="h-5 w-5 text-green-600" />
                    Plant Lineage
                  </CardTitle>
                  <CardDescription>
                    Track propagation relationships
                  </CardDescription>
                  <div
                    className="mt-2 flex flex-wrap items-center gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
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
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          {/* Collapsed summary - shows parent/children if they exist */}
          {!isOpen && hasLineage && (
            <CardContent className="pt-3 space-y-2">
              {hasParent && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
                    <ArrowUp className="h-3 w-3" />
                    Parent
                  </div>
                  <PlantCard
                    plant={parentPlant}
                    photoUrl={photoMap.get(parentPlant.id) ?? null}
                    badge={
                      <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                        <Sprout className="h-3 w-3" />
                        Mother
                      </Badge>
                    }
                    compact
                  />
                </div>
              )}
              {hasChildren && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
                    <ArrowDown className="h-3 w-3" />
                    Children
                  </div>
                  {childrenPlants.length === 1 ? (
                    <PlantCard
                      plant={childrenPlants[0]}
                      photoUrl={photoMap.get(childrenPlants[0].id) ?? null}
                      badge={
                        <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                          <Sprout className="h-3 w-3" />
                          Child
                        </Badge>
                      }
                      compact
                    />
                  ) : (
                    <CollapsibleTrigger asChild>
                      <button className="flex-1 p-2 rounded-lg border border-dashed bg-card hover:bg-accent/50 transition-colors text-sm text-muted-foreground">
                        {childrenPlants.length} propagations - click to expand
                      </button>
                    </CollapsibleTrigger>
                  )}
                </div>
              )}
            </CardContent>
          )}

          {/* Collapsed state with no lineage - just show minimal padding */}
          {!isOpen && !hasLineage && (
            <CardContent className="pt-2 pb-1">
              <CollapsibleTrigger asChild>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  No lineage yet - click to expand
                </button>
              </CollapsibleTrigger>
            </CardContent>
          )}

          <CollapsibleContent>
            <CardContent className="pt-3 space-y-4">
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
                  <div className="rounded-lg border border-dashed p-3 text-center">
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
                  <div className="rounded-lg border border-dashed p-3 text-center">
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
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </section>
  );
}
