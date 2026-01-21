"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Search, Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { setParentPlant, clearParentPlant } from "../actions";

interface PlantOption {
  id: string;
  name: string;
  nickname: string | null;
}

interface SetParentDialogProps {
  plantId: string;
  plantName: string;
  currentParentId: string | null;
  currentParentName: string | null;
  availablePlants: PlantOption[];
}

export function SetParentDialog({
  plantId,
  plantName,
  currentParentId,
  currentParentName,
  availablePlants,
}: SetParentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [selectedParent, setSelectedParent] = useState<PlantOption | null>(null);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [propagationDate, setPropagationDate] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // If there's a current parent, find it in the available plants
      if (currentParentId) {
        const parent = availablePlants.find((p) => p.id === currentParentId);
        setSelectedParent(parent || null);
      } else {
        setSelectedParent(null);
      }
      setSearch("");
      setDropdownOpen(false);
      setPropagationDate(new Date().toISOString().split("T")[0]);
      setError(null);
    }
  }, [isOpen, currentParentId, availablePlants]);

  // Filter plants based on search
  const filteredPlants = useMemo(() => {
    const lower = search.toLowerCase();
    if (!lower) return availablePlants;
    return availablePlants.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.nickname && p.nickname.toLowerCase().includes(lower))
    );
  }, [availablePlants, search]);

  function handleSelectParent(plant: PlantOption) {
    setSelectedParent(plant);
    setSearch("");
    setDropdownOpen(false);
  }

  async function handleSubmit() {
    setError(null);

    if (!selectedParent) {
      setError("Please select a parent plant");
      return;
    }

    startTransition(async () => {
      const result = await setParentPlant(plantId, selectedParent.id, propagationDate);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  async function handleClearParent() {
    setError(null);

    startTransition(async () => {
      const result = await clearParentPlant(plantId);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  const hasCurrentParent = !!currentParentId;
  const hasSelectedDifferentParent =
    selectedParent && selectedParent.id !== currentParentId;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <GitBranch className="h-4 w-4" />
        {currentParentId ? "Change parent" : "Set parent"}
      </Button>

      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            {currentParentId ? "Change parent plant" : "Set parent plant"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Link <span className="font-medium">{plantName}</span> to its parent
            plant to track propagation lineage.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Current parent info */}
          {hasCurrentParent && (
            <div className="rounded-lg border border-dashed p-3 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Current parent:{" "}
                <span className="font-medium text-foreground">
                  {currentParentName}
                </span>
              </p>
            </div>
          )}

          {/* Parent selector */}
          <div className="space-y-2">
            <Label>Parent plant</Label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={dropdownOpen}
                className="w-full justify-between font-normal"
                onClick={() => setDropdownOpen(!dropdownOpen)}
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
              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-0 shadow-md">
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Search plants..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
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
          </div>

          {/* Propagation date (only show if setting a new parent or changing parent) */}
          {(!currentParentId || hasSelectedDifferentParent) && selectedParent && (
            <div className="space-y-2">
              <Label htmlFor="parent-date">Propagation date</Label>
              <Input
                id="parent-date"
                type="date"
                value={propagationDate}
                onChange={(e) => setPropagationDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                When was this cutting taken from the parent?
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {hasCurrentParent && (
            <Button
              variant="outline"
              onClick={handleClearParent}
              disabled={isPending}
              className="gap-1.5 text-destructive hover:text-destructive sm:mr-auto"
            >
              <X className="h-4 w-4" />
              Remove parent
            </Button>
          )}
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedParent || selectedParent.id === currentParentId}
          >
            {isPending
              ? "Saving..."
              : currentParentId
              ? "Update parent"
              : "Set parent"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
