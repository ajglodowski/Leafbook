"use client";

import { Filter, History, List, Newspaper, ShieldAlert, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";

export type TimelineFeedType = "all" | "events" | "journal" | "issues";

const eventTypeLabels: Record<string, string> = {
  watered: "Watered",
  fertilized: "Fertilized",
  repotted: "Repotted",
  pruned: "Pruned",
  rotated: "Rotated",
  misted: "Misted",
  cleaned: "Cleaned",
  propagated: "Propagated",
  acquired: "Acquired",
  legacy: "Legacy",
  restored: "Restored",
  other: "Other",
};

interface TimelineHeaderProps {
  plants: { id: string; name: string }[];
  selectedPlantId?: string;
  selectedFeedType: TimelineFeedType;
  selectedEventType?: string;
}

export function TimelineHeader({
  plants,
  selectedPlantId,
  selectedFeedType,
  selectedEventType,
}: TimelineHeaderProps) {
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
    router.push(`/timeline${queryString ? `?${queryString}` : ""}`);
  }

  function handlePlantChange(plantId: string | null) {
    updateParams({ plant: !plantId || plantId === "all" ? null : plantId });
  }

  function handleTypeChange(type: TimelineFeedType | null) {
    updateParams({
      type: !type || type === "all" ? null : type,
      event: type === "events" ? selectedEventType || null : null,
    });
  }

  function handleEventTypeChange(eventType: string | null) {
    updateParams({ event: !eventType || eventType === "all" ? null : eventType });
  }

  function clearFilters() {
    router.push("/timeline");
  }

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);
  const hasActiveFilters = selectedPlantId || selectedFeedType !== "all" || selectedEventType;

  const getSubtitle = () => {
    const parts: string[] = [];
    if (selectedFeedType === "events") parts.push("Plant events");
    else if (selectedFeedType === "journal") parts.push("Journal entries");
    else if (selectedFeedType === "issues") parts.push("Plant issues");
    else parts.push("Events, journal entries, and issues");

    if (selectedEventType && selectedFeedType === "events") {
      parts.push(`(${eventTypeLabels[selectedEventType] || "Event"})`);
    }
    if (selectedPlant) parts.push(`for ${selectedPlant.name}`);

    return parts.join(" ");
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Timeline</h1>
        <p className="mt-1 text-muted-foreground">{getSubtitle()}</p>
      </div>

      {plants.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedFeedType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                {selectedFeedType === "all" && <List className="h-4 w-4 text-muted-foreground" />}
                {selectedFeedType === "events" && <History className="h-4 w-4 text-muted-foreground" />}
                {selectedFeedType === "journal" && <Newspaper className="h-4 w-4 text-muted-foreground" />}
                {selectedFeedType === "issues" && <ShieldAlert className="h-4 w-4 text-muted-foreground" />}
                <span>
                  {selectedFeedType === "all" && "All"}
                  {selectedFeedType === "events" && "Events"}
                  {selectedFeedType === "journal" && "Journal"}
                  {selectedFeedType === "issues" && "Issues"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="journal">Journal</SelectItem>
              <SelectItem value="issues">Issues</SelectItem>
            </SelectContent>
          </Select>

          {(selectedFeedType === "events" || selectedFeedType === "all") && (
            <Select
              value={selectedEventType || "all"}
              onValueChange={handleEventTypeChange}
            >
              <SelectTrigger className="w-[170px]">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEventType ? eventTypeLabels[selectedEventType] : "All events"}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedPlantId || "all"} onValueChange={handlePlantChange}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>{selectedPlant ? selectedPlant.name : "All plants"}</span>
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
