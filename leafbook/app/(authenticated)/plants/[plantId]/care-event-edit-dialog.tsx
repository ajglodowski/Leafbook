"use client";

import { Calendar, Check, ChevronsUpDown, Droplets, Pencil, Search, Sparkles, Sprout, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  deleteCareEvent,
  deletePropagationEvent,
  updateCareEvent,
  updatePropagationEvent,
} from "./actions";

// Event type configs
const eventConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  watered: { label: "Watering", icon: Droplets, color: "text-blue-500" },
  fertilized: { label: "Fertilizing", icon: Sparkles, color: "text-amber-500" },
  propagated: { label: "Propagation", icon: Sprout, color: "text-emerald-500" },
};

interface PlantOption {
  id: string;
  name: string;
  nickname: string | null;
}

interface CareEventData {
  id: string;
  event_type: string;
  event_date: string;
  notes: string | null;
  metadata?: {
    parent_plant_id?: string | null;
  } | null;
}

interface CareEventEditDialogProps {
  plantName: string;
  event: CareEventData;
  // For propagation events only
  availablePlantsForParent?: PlantOption[];
  currentParentName?: string | null;
  trigger?: React.ReactNode;
}

export function CareEventEditDialog({
  plantName,
  event,
  availablePlantsForParent = [],
  currentParentName,
  trigger,
}: CareEventEditDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isPropagation = event.event_type === "propagated";
  const config = eventConfig[event.event_type] || eventConfig.watered;
  const Icon = config.icon;

  // Form state
  const [eventDate, setEventDate] = useState(
    event.event_date ? event.event_date.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(event.notes || "");
  
  // Propagation-specific state
  const [selectedParent, setSelectedParent] = useState<PlantOption | null>(null);
  const [parentSearch, setParentSearch] = useState("");
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEventDate(
        event.event_date ? event.event_date.split("T")[0] : new Date().toISOString().split("T")[0]
      );
      setNotes(event.notes || "");
      setError(null);
      setParentSearch("");
      setParentDropdownOpen(false);

      // For propagation, find the current parent
      if (isPropagation && event.metadata?.parent_plant_id) {
        const parent = availablePlantsForParent.find(
          (p) => p.id === event.metadata?.parent_plant_id
        );
        setSelectedParent(parent || null);
      } else {
        setSelectedParent(null);
      }
    }
  }, [isOpen, event, isPropagation, availablePlantsForParent]);

  // Filter plants based on search
  const filteredPlants = useMemo(() => {
    const lower = parentSearch.toLowerCase();
    if (!lower) return availablePlantsForParent;
    return availablePlantsForParent.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.nickname && p.nickname.toLowerCase().includes(lower))
    );
  }, [availablePlantsForParent, parentSearch]);

  function handleSelectParent(plant: PlantOption) {
    setSelectedParent(plant);
    setParentSearch("");
    setParentDropdownOpen(false);
  }

  async function handleSubmit() {
    setError(null);

    startTransition(async () => {
      let result;

      if (isPropagation) {
        result = await updatePropagationEvent(event.id, {
          eventDate,
          notes: notes.trim() || null,
          parentPlantId: selectedParent?.id ?? null,
        });
      } else {
        result = await updateCareEvent(event.id, {
          eventDate,
          notes: notes.trim() || null,
        });
      }

      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  async function handleDelete() {
    startTransition(async () => {
      const result = isPropagation
        ? await deletePropagationEvent(event.id)
        : await deleteCareEvent(event.id);

      if (result.success) {
        setIsOpen(false);
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        setError(result.error || "Could not delete event");
        setShowDeleteConfirm(false);
      }
    });
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger ? (
          <div onClick={() => setIsOpen(true)} className="cursor-pointer">
            {trigger}
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}

        <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl font-semibold flex items-center gap-2">
              <Icon className={cn("h-5 w-5", config.color)} />
              Edit {config.label.toLowerCase()} event
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update the details for this {config.label.toLowerCase()} event on{" "}
              <span className="font-medium">{plantName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Event date */}
            <div className="space-y-2">
              <Label htmlFor="event-date" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date
              </Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            {/* Parent selector for propagation events */}
            {isPropagation && (
              <div className="space-y-2">
                <Label>Parent plant</Label>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={parentDropdownOpen}
                    className="w-full justify-between font-normal"
                    onClick={() => setParentDropdownOpen(!parentDropdownOpen)}
                  >
                    {selectedParent ? (
                      <span className="truncate">
                        {selectedParent.name}
                        {selectedParent.nickname && (
                          <span className="text-muted-foreground ml-1">
                            ({selectedParent.nickname})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Select parent plant...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  {parentDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-0 shadow-md">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search plants..."
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1">
                        {/* Option to clear parent */}
                        <button
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                            !selectedParent && "bg-accent"
                          )}
                          onClick={() => {
                            setSelectedParent(null);
                            setParentDropdownOpen(false);
                          }}
                        >
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            {!selectedParent && <Check className="h-4 w-4" />}
                          </span>
                          <span className="text-muted-foreground">No parent</span>
                        </button>
                        {filteredPlants.length === 0 ? (
                          <p className="py-6 text-center text-sm text-muted-foreground">
                            No plants found
                          </p>
                        ) : (
                          filteredPlants.map((plant) => (
                            <button
                              key={plant.id}
                              type="button"
                              className={cn(
                                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                selectedParent?.id === plant.id && "bg-accent"
                              )}
                              onClick={() => handleSelectParent(plant)}
                            >
                              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                {selectedParent?.id === plant.id && (
                                  <Check className="h-4 w-4" />
                                )}
                              </span>
                              <div className="flex flex-col items-start">
                                <span>{plant.name}</span>
                                {plant.nickname && (
                                  <span className="text-xs text-muted-foreground">
                                    {plant.nickname}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {currentParentName && event.metadata?.parent_plant_id === selectedParent?.id && (
                  <p className="text-xs text-muted-foreground">
                    Current parent: {currentParentName}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="event-notes">Notes (optional)</Label>
              <Textarea
                id="event-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isPropagation
                    ? "Any notes about this propagation..."
                    : `Any notes about this ${config.label.toLowerCase()}...`
                }
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1 sm:mr-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete event
            </Button>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {config.label.toLowerCase()} event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this {config.label.toLowerCase()} event from{" "}
              {plantName}&apos;s timeline. This action cannot be undone.
              {isPropagation && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  Note: This will not remove the parent relationship.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep event</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
