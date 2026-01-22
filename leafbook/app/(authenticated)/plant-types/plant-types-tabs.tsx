"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { GitBranch, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompactedPlantTypeTaxonomyTree } from "@/lib/queries/plant-types";
import { PlantTypeTaxonomyTree } from "./plant-type-taxonomy-tree";

type TabValue = "catalog" | "taxonomy";

interface PlantTypesTabsProps {
  catalogContent: ReactNode;
  taxonomyTree: CompactedPlantTypeTaxonomyTree;
}

export function PlantTypesTabs({
  catalogContent,
  taxonomyTree,
}: PlantTypesTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("catalog");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b pb-2 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <Button
          variant={activeTab === "catalog" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setActiveTab("catalog")}
        >
          <List className="h-4 w-4" />
          Catalog
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

      {activeTab === "catalog" && catalogContent}

      {activeTab === "taxonomy" && (
        <PlantTypeTaxonomyTree tree={taxonomyTree} />
      )}
    </div>
  );
}
