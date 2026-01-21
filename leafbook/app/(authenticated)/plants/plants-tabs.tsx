"use client";

import { useState } from "react";
import { List, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlantWithTypes, PlantDueTask, PlantTypeSummary, OriginStats } from "@/lib/queries/plants";
import { PlantCollectionView } from "./plant-collection-view";
import { OriginMap } from "@/components/origin-map";

type TabValue = "collection" | "origins";

interface PlantsTabsProps {
  plants: PlantWithTypes[];
  plantTypes: PlantTypeSummary[];
  dueTasks: PlantDueTask[];
  photosByPlant: Map<string, { id: string; url: string }[]>;
  originStats: OriginStats;
}

export function PlantsTabs({
  plants,
  plantTypes,
  dueTasks,
  photosByPlant,
  originStats,
}: PlantsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("collection");

  return (
    <div className="space-y-6">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "collection" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2"
          onClick={() => setActiveTab("collection")}
        >
          <List className="h-4 w-4" />
          Collection
        </Button>
        <Button
          variant={activeTab === "origins" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2"
          onClick={() => setActiveTab("origins")}
        >
          <Globe className="h-4 w-4" />
          Origins
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

      {activeTab === "origins" && (
        <OriginMap stats={originStats} />
      )}
    </div>
  );
}
