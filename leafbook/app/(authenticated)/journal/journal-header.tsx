"use client";

import { Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";

interface JournalHeaderProps {
  plants: { id: string; name: string }[];
  selectedPlantId?: string;
}

export function JournalHeader({
  plants,
  selectedPlantId,
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

  function clearFilters() {
    router.push("/journal");
  }

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);
  const hasActiveFilters = selectedPlantId;

  const getSubtitle = () => {
    if (selectedPlant) {
      return `Journal entries for ${selectedPlant.name}`;
    }
    return "Journal entries across your plants";
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
