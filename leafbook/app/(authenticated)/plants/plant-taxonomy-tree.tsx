"use client";

import { ChevronDown, ChevronRight, GitBranch,HelpCircle, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CompactedTaxonomyTree, CompactedTreeNode, Taxon } from "@/lib/queries/plants";

interface PlantTaxonomyTreeProps {
  tree: CompactedTaxonomyTree;
  photosByPlant: Map<string, { id: string; url: string }[]>;
}

// Map taxonomic ranks to display labels
const rankLabels: Record<string, string> = {
  kingdom: "Kingdom",
  phylum: "Phylum",
  class: "Class",
  order: "Order",
  family: "Family",
  subfamily: "Subfamily",
  tribe: "Tribe",
  genus: "Genus",
  species: "Species",
  subspecies: "Subspecies",
  variety: "Variety",
};

// Get display name for a single taxon
function getTaxonName(taxon: Taxon): string {
  return taxon.common_name || taxon.scientific_name || "Unknown";
}

// Build a path label from an array of taxa
function buildPathLabel(path: Taxon[]): string {
  return path.map(getTaxonName).join(" → ");
}

// Get the last taxon's rank for badge display
function getEndpointRank(path: Taxon[]): string {
  const last = path[path.length - 1];
  if (!last?.rank) return "";
  return rankLabels[last.rank.toLowerCase()] || last.rank;
}

// Plant card component (compact version for leaf nodes)
function PlantCard({
  plant,
  photosByPlant,
}: {
  plant: { id: string; name: string; nickname: string | null; active_photo_id: string | null; plantTypeName: string | null };
  photosByPlant: Map<string, { id: string; url: string }[]>;
}) {
  const photos = photosByPlant.get(plant.id);
  let thumbnailUrl: string | null = null;
  if (photos && photos.length > 0) {
    if (plant.active_photo_id) {
      const activePhoto = photos.find((p) => p.id === plant.active_photo_id);
      if (activePhoto) thumbnailUrl = activePhoto.url;
    }
    if (!thumbnailUrl) thumbnailUrl = photos[0].url;
  }

  return (
    <Link href={`/plants/${plant.id}`}>
      <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
        {thumbnailUrl ? (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={thumbnailUrl}
              alt={plant.name}
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{plant.name}</p>
          {plant.nickname && (
            <p className="text-xs text-muted-foreground truncate">"{plant.nickname}"</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function groupPlantsByType(
  plants: { id: string; name: string; nickname: string | null; active_photo_id: string | null; plantTypeName: string | null }[]
) {
  const groups = new Map<string, typeof plants>();
  plants.forEach((plant) => {
    const key = plant.plantTypeName || "Unknown type";
    const existing = groups.get(key) || [];
    existing.push(plant);
    groups.set(key, existing);
  });
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

// Recursive compacted tree node component
function CompactedNode({
  node,
  photosByPlant,
  depth = 0,
}: {
  node: CompactedTreeNode;
  photosByPlant: Map<string, { id: string; url: string }[]>;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  
  const pathLabel = buildPathLabel(node.path);
  const endpointRank = getEndpointRank(node.path);
  const hasChildren = node.children.length > 0;
  const hasPlants = node.plants.length > 0;
  const isExpandable = hasChildren || hasPlants;

  // Visual indent based on depth
  const indent = depth * 16;

  return (
    <div style={{ marginLeft: indent }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger 
          className="flex w-full items-center gap-2 py-1.5 px-2 text-left hover:bg-muted/50 rounded-md transition-colors group"
          disabled={!isExpandable}
        >
          {/* Expand/collapse icon */}
          {isExpandable ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-4 shrink-0" />
          )}
          
          {/* Branch indicator for multi-child nodes */}
          {node.isBranchPoint && (
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-primary/60" />
          )}
          
          {/* Path label */}
          <span className="flex-1 min-w-0 font-medium text-sm wrap-break-word">
            {pathLabel}
          </span>
          
          {/* Rank badge */}
          {endpointRank && (
            <Badge variant="outline" className="text-xs h-5 px-1.5 shrink-0">
              {endpointRank}
            </Badge>
          )}
          
          {/* Plant count */}
          <span className="text-xs text-muted-foreground shrink-0">
            {node.plantCount}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Render child nodes */}
          {hasChildren && (
            <div className="border-l border-muted ml-2 mt-1">
              {node.children.map((child, idx) => (
                <CompactedNode
                  key={child.path[0]?.id || idx}
                  node={child}
                  photosByPlant={photosByPlant}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
          
          {/* Render plants at leaf nodes */}
          {hasPlants && (
            <div className="ml-6 mt-2 space-y-2 border-l border-muted pl-3">
              {groupPlantsByType(node.plants).map(([plantTypeName, plants]) => (
                <div key={plantTypeName} className="rounded-md border bg-muted/20 p-2">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">
                    {plantTypeName}
                  </div>
                  <div className="space-y-0.5">
                    {plants.map((plant) => (
                      <PlantCard
                        key={plant.id}
                        plant={plant}
                        photosByPlant={photosByPlant}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function PlantTaxonomyTree({ tree, photosByPlant }: PlantTaxonomyTreeProps) {
  const hasData = tree.roots.length > 0;
  const hasUnclassified = tree.plantsWithoutTaxon.length > 0;
  const [showUnclassified, setShowUnclassified] = useState(!hasData);

  // Helper to get thumbnail URL for a plant
  function getThumbnailUrl(plantId: string, activePhotoId: string | null): string | null {
    const photos = photosByPlant.get(plantId);
    if (!photos || photos.length === 0) return null;
    if (activePhotoId) {
      const activePhoto = photos.find((p) => p.id === activePhotoId);
      if (activePhoto) return activePhoto.url;
    }
    return photos[0].url;
  }

  if (!hasData && !hasUnclassified) {
    return (
      <EmptyState
        icon={Leaf}
        title="No taxonomy data"
        description="Your plants don't have taxonomic classification yet. Add plant types with taxon information to see the tree."
      />
    );
  }

  // Count classified plants
  const classifiedCount = tree.totalPlants - tree.plantsWithoutTaxon.length;
  
  // Count branch points for summary
  function countBranchPoints(nodes: CompactedTreeNode[]): number {
    let count = 0;
    for (const node of nodes) {
      if (node.isBranchPoint) count++;
      count += countBranchPoints(node.children);
    }
    return count;
  }
  const branchPoints = countBranchPoints(tree.roots);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{classifiedCount} classified</span>
        {hasUnclassified && (
          <span>{tree.plantsWithoutTaxon.length} unclassified</span>
        )}
        {branchPoints > 0 && (
          <>
            <span className="text-muted-foreground/60">·</span>
            <span>{branchPoints} branch point{branchPoints !== 1 ? "s" : ""}</span>
          </>
        )}
      </div>

      {/* Compacted tree */}
      {hasData && (
        <Card className="p-3">
          <div className="space-y-0.5">
            {tree.roots.map((root, idx) => (
              <CompactedNode
                key={root.path[0]?.id || idx}
                node={root}
                photosByPlant={photosByPlant}
                depth={0}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Unclassified plants */}
      {hasUnclassified && (
        <Card className="overflow-hidden">
          <Collapsible open={showUnclassified} onOpenChange={setShowUnclassified}>
            <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors">
              {showUnclassified ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Unclassified</span>
              </div>
              <Badge variant="outline" className="ml-auto shrink-0">
                {tree.plantsWithoutTaxon.length} plant{tree.plantsWithoutTaxon.length !== 1 ? "s" : ""}
              </Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t px-4 py-3">
                <div className="space-y-2">
                  {groupPlantsByType(tree.plantsWithoutTaxon).map(([plantTypeName, plants]) => (
                    <div key={plantTypeName} className="rounded-md border bg-muted/20 p-2">
                      <div className="mb-1 text-xs font-semibold text-muted-foreground">
                        {plantTypeName}
                      </div>
                      <div className="space-y-0.5">
                        {plants.map((plant) => {
                          const thumbnailUrl = getThumbnailUrl(plant.id, plant.active_photo_id);
                          return (
                            <Link key={plant.id} href={`/plants/${plant.id}`}>
                              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                {thumbnailUrl ? (
                                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                                    <Image
                                      src={thumbnailUrl}
                                      alt={plant.name}
                                      fill
                                      className="object-cover"
                                      sizes="32px"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                                    <Leaf className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{plant.name}</p>
                                  {plant.nickname && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      "{plant.nickname}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}
