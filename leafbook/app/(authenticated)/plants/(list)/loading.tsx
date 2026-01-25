import { Archive, Compass, GitBranch, List, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { PlantCardLoading } from "../plant-card-loading";

export default function PlantsLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">My Plants</h1>
          <p className="mt-1 text-muted-foreground">
            Your personal plant collection
          </p>
        </div>
        <Button disabled className="gap-1">
          <Plus className="h-4 w-4" />
          Add plant
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <Button variant="ghost" size="sm" className="gap-2 shrink-0" disabled>
          <List className="h-4 w-4" />
          Collection
          <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
            <Skeleton className="h-3 w-2 rounded-sm" />
          </Badge>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 shrink-0" disabled>
          <Archive className="h-4 w-4" />
          Legacy
          <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
            <Skeleton className="h-3 w-2 rounded-sm" />
          </Badge>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 shrink-0" disabled>
          <Compass className="h-4 w-4" />
          Origins
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 shrink-0" disabled>
          <GitBranch className="h-4 w-4" />
          Taxonomy
        </Button>
      </div>

      {/* Plants grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <PlantCardLoading key={i} />
        ))}
      </div>
    </div>
  );
}
