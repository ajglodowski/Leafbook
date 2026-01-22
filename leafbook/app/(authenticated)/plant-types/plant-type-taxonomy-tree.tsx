"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ChevronDown, Leaf, HelpCircle, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  CompactedPlantTypeTaxonomyTree,
  CompactedPlantTypeTreeNode,
  PlantTypeTaxonomyEntry,
} from "@/lib/queries/plant-types";
import type { Taxon } from "@/lib/queries/plants";

interface PlantTypeTaxonomyTreeProps {
  tree: CompactedPlantTypeTaxonomyTree;
}

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

function getTaxonName(taxon: Taxon): string {
  return taxon.common_name || taxon.scientific_name || "Unknown";
}

function buildPathLabel(path: Taxon[]): string {
  return path.map(getTaxonName).join(" → ");
}

function getEndpointRank(path: Taxon[]): string {
  const last = path[path.length - 1];
  if (!last?.rank) return "";
  return rankLabels[last.rank.toLowerCase()] || last.rank;
}

function sortPlantTypes(plantTypes: PlantTypeTaxonomyEntry[]) {
  return [...plantTypes].sort((a, b) => a.name.localeCompare(b.name));
}

function PlantTypeRow({ plantType }: { plantType: PlantTypeTaxonomyEntry }) {
  return (
    <Link href={`/plant-types/${plantType.id}`}>
      <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {plantType.primary_photo_url ? (
            <Image
              src={plantType.primary_photo_url}
              alt={plantType.name}
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <Leaf className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{plantType.name}</p>
          {plantType.scientific_name && (
            <p className="text-xs text-muted-foreground truncate italic">
              {plantType.scientific_name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function CompactedNode({
  node,
  depth = 0,
}: {
  node: CompactedPlantTypeTreeNode;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const pathLabel = buildPathLabel(node.path);
  const endpointRank = getEndpointRank(node.path);
  const hasChildren = node.children.length > 0;
  const hasPlantTypes = node.plantTypes.length > 0;
  const isExpandable = hasChildren || hasPlantTypes;
  const indent = depth * 16;

  return (
    <div style={{ marginLeft: indent }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className="flex w-full items-center gap-2 py-1.5 px-2 text-left hover:bg-muted/50 rounded-md transition-colors group"
          disabled={!isExpandable}
        >
          {isExpandable ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {node.isBranchPoint && (
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-primary/60" />
          )}

          <span className="flex-1 min-w-0 font-medium text-sm wrap-break-word">
            {pathLabel}
          </span>

          {endpointRank && (
            <Badge variant="outline" className="text-xs h-5 px-1.5 shrink-0">
              {endpointRank}
            </Badge>
          )}

          <span className="text-xs text-muted-foreground shrink-0">
            {node.plantCount}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {hasChildren && (
            <div className="border-l border-muted ml-2 mt-1">
              {node.children.map((child, idx) => (
                <CompactedNode
                  key={child.path[0]?.id || idx}
                  node={child}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}

          {hasPlantTypes && (
            <div className="ml-6 mt-2 space-y-2 border-l border-muted pl-3">
              {sortPlantTypes(node.plantTypes).map((plantType) => (
                <PlantTypeRow key={plantType.id} plantType={plantType} />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function PlantTypeTaxonomyTree({ tree }: PlantTypeTaxonomyTreeProps) {
  const hasData = tree.roots.length > 0;
  const hasUnclassified = tree.plantTypesWithoutTaxon.length > 0;
  const [showUnclassified, setShowUnclassified] = useState(!hasData);

  if (!hasData && !hasUnclassified) {
    return (
      <EmptyState
        icon={Leaf}
        title="No taxonomy data"
        description="Plant types need taxon information to show the taxonomy tree."
      />
    );
  }

  const classifiedCount = tree.totalPlantTypes - tree.plantTypesWithoutTaxon.length;

  function countBranchPoints(nodes: CompactedPlantTypeTreeNode[]): number {
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
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{classifiedCount} classified</span>
        {hasUnclassified && (
          <span>{tree.plantTypesWithoutTaxon.length} unclassified</span>
        )}
        {branchPoints > 0 && (
          <>
            <span className="text-muted-foreground/60">·</span>
            <span>{branchPoints} branch point{branchPoints !== 1 ? "s" : ""}</span>
          </>
        )}
      </div>

      {hasData && (
        <Card className="p-3">
          <div className="space-y-0.5">
            {tree.roots.map((root, idx) => (
              <CompactedNode
                key={root.path[0]?.id || idx}
                node={root}
                depth={0}
              />
            ))}
          </div>
        </Card>
      )}

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
                {tree.plantTypesWithoutTaxon.length} type
                {tree.plantTypesWithoutTaxon.length !== 1 ? "s" : ""}
              </Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t px-4 py-3">
                <div className="space-y-2">
                  {sortPlantTypes(tree.plantTypesWithoutTaxon).map((plantType) => (
                    <PlantTypeRow key={plantType.id} plantType={plantType} />
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
