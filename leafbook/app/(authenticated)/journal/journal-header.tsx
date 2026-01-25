"use client";

import { AlertTriangle, BookOpen, Filter, List, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";

export type FeedType = "all" | "journal" | "issues";

interface JournalHeaderProps {
  plants: { id: string; name: string }[];
  selectedPlantId?: string;
  selectedFeedType: FeedType;
}

export function JournalHeader({
  plants,
  selectedPlantId,
  selectedFeedType,
}: JournalHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    router.push(`/journal${queryString ? `?${queryString}` : ""}`);
  }

  function handlePlantChange(plantId: string | null) {
    updateParams({ plant: !plantId || plantId === "all" ? null : plantId });
  }

  function handleTypeChange(type: FeedType | null) {
    updateParams({ type: !type || type === "all" ? null : type });
  }

  function clearFilters() {
    router.push("/journal");
  }

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);
  const hasActiveFilters = selectedPlantId || selectedFeedType !== "all";

  const getSubtitle = () => {
    const parts: string[] = [];
    if (selectedFeedType === "journal") parts.push("Journal entries");
    else if (selectedFeedType === "issues") parts.push("Plant issues");
    else parts.push("Journal entries and issues");
    
    if (selectedPlant) parts.push(`for ${selectedPlant.name}`);
    
    return parts.join(" ");
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-1 text-muted-foreground">{getSubtitle()}</p>
      </div>

      {/* Filters */}
      {plants.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <Select
            value={selectedFeedType}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                {selectedFeedType === "all" && <List className="h-4 w-4 text-muted-foreground" />}
                {selectedFeedType === "journal" && <BookOpen className="h-4 w-4 text-muted-foreground" />}
                {selectedFeedType === "issues" && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                <span>
                  {selectedFeedType === "all" && "All"}
                  {selectedFeedType === "journal" && "Journal"}
                  {selectedFeedType === "issues" && "Issues"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="journal">Journal</SelectItem>
              <SelectItem value="issues">Issues</SelectItem>
            </SelectContent>
          </Select>

          {/* Plant filter */}
          <Select
            value={selectedPlantId || "all"}
            onValueChange={handlePlantChange}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedPlant ? selectedPlant.name : "All plants"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plants</SelectItem>
              {plants.map((plant) => (
                <SelectItem key={plant.id} value={plant.id}>
                  {plant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
