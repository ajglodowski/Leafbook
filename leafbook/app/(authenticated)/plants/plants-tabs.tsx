"use client";

import { Archive, Compass, GitBranch,List } from "lucide-react";
import { useState } from "react";

import { OriginMap } from "@/app/(authenticated)/plants/origin-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompactedTaxonomyTree,OriginStats, PlantDueTask, PlantTypeSummary, PlantWithTypes } from "@/lib/queries/plants";

import { LegacyPlantsList } from "./legacy-plants-list";
import { PlantCollectionView } from "./plant-collection-view";
import { PlantTaxonomyTree } from "./plant-taxonomy-tree";

type TabValue = "collection" | "legacy" | "origins" | "taxonomy";

interface PlantsTabsProps {
  plants: PlantWithTypes[];
  legacyPlants: PlantWithTypes[];
  plantTypes: PlantTypeSummary[];
  dueTasks: PlantDueTask[];
  photosByPlant: Map<string, { id: string; url: string }[]>;
  originStats: OriginStats;
  taxonomyTree: CompactedTaxonomyTree;
}

export function PlantsTabs({
  plants,
  legacyPlants,
  plantTypes,
  dueTasks,
  photosByPlant,
  originStats,
  taxonomyTree,
}: PlantsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("collection");

  return (
    <div className="space-y-6">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <Button
          variant={activeTab === "collection" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setActiveTab("collection")}
        >
          <List className="h-4 w-4" />
          Collection
          {plants.length > 0 && (
            <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
              {plants.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === "legacy" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setActiveTab("legacy")}
        >
          <Archive className="h-4 w-4" />
          Legacy
          {legacyPlants.length > 0 && (
            <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
              {legacyPlants.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === "origins" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setActiveTab("origins")}
        >
          <Compass className="h-4 w-4" />
          Origins
        </Button>
        <Button
          variant={activeTab === "taxonomy" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setActiveTab("taxonomy")}
        >
          <GitBranch className="h-4 w-4" />
          Taxonomy
        </Button>
      </div>

      {/* Tab content */}
      {activeTab === "collection" && (
        <PlantCollectionView
          plants={plants}
          plantTypes={plantTypes}
          dueTasks={dueTasks}
          photosByPlant={photosByPlant}
        />
      )}

      {activeTab === "legacy" && (
        <LegacyPlantsList
          plants={legacyPlants}
          photosByPlant={photosByPlant}
        />
      )}

      {activeTab === "origins" && (
        <OriginMap stats={originStats} />
      )}

      {activeTab === "taxonomy" && (
        <PlantTaxonomyTree tree={taxonomyTree} photosByPlant={photosByPlant} />
      )}
    </div>
  );
}
