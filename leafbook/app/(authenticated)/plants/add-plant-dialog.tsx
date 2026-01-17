"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Home, TreePine, ExternalLink, Search, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { createPlant } from "./actions";

interface PlantType {
  id: string;
  name: string;
  scientific_name: string | null;
}

interface AddPlantDialogProps {
  plantTypes: PlantType[];
}

const lightOptions = [
  { value: "dark", label: "Dark" },
  { value: "low_indirect", label: "Low Indirect" },
  { value: "medium_indirect", label: "Medium Indirect" },
  { value: "bright_indirect", label: "Bright Indirect" },
  { value: "direct", label: "Direct" },
];

const sizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "extra_large", label: "Extra Large" },
];

function getLightLabel(value: string): string {
  return lightOptions.find((opt) => opt.value === value)?.label || value;
}

function getSizeLabel(value: string): string {
  return sizeOptions.find((opt) => opt.value === value)?.label || value;
}

export function AddPlantDialog({ plantTypes }: AddPlantDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  
  // Required fields
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType | null>(null);
  const [name, setName] = useState("");
  
  // Plant type search
  const [plantTypeSearch, setPlantTypeSearch] = useState("");
  const [plantTypeDropdownOpen, setPlantTypeDropdownOpen] = useState(false);
  
  // Optional fields
  const [nickname, setNickname] = useState("");
  const [plantLocation, setPlantLocation] = useState<"indoor" | "outdoor">("indoor");
  const [location, setLocation] = useState("");
  const [lightExposure, setLightExposure] = useState("");
  const [sizeCategory, setSizeCategory] = useState("");
  const [acquiredAt, setAcquiredAt] = useState("");
  const [howAcquired, setHowAcquired] = useState("");
  const [description, setDescription] = useState("");
  
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlantType(null);
      setName("");
      setPlantTypeSearch("");
      setPlantTypeDropdownOpen(false);
      setNickname("");
      setPlantLocation("indoor");
      setLocation("");
      setLightExposure("");
      setSizeCategory("");
      setAcquiredAt("");
      setHowAcquired("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

  // Auto-fill name when plant type is selected (if name is empty)
  useEffect(() => {
    if (selectedPlantType && !name) {
      setName(selectedPlantType.name);
    }
  }, [selectedPlantType, name]);

  const canSubmit = name.trim() && selectedPlantType;

  async function handleSubmit() {
    setError(null);
    
    if (!selectedPlantType) {
      setError("Please select a plant type");
      return;
    }
    
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const formData = new FormData();
    formData.set("plantTypeId", selectedPlantType.id);
    formData.set("name", name.trim());
    formData.set("plant_location", plantLocation);
    if (nickname.trim()) formData.set("nickname", nickname.trim());
    if (location.trim()) formData.set("location", location.trim());
    if (lightExposure) formData.set("light_exposure", lightExposure);
    if (sizeCategory) formData.set("size_category", sizeCategory);
    if (acquiredAt) formData.set("acquired_at", acquiredAt);
    if (howAcquired.trim()) formData.set("how_acquired", howAcquired.trim());
    if (description.trim()) formData.set("description", description.trim());

    startTransition(async () => {
      const result = await createPlant(formData);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  // Filter plant types based on search
  const filteredPlantTypes = useMemo(() => {
    const lower = plantTypeSearch.toLowerCase();
    if (!lower) return plantTypes;
    return plantTypes.filter(
      (pt) =>
        pt.name.toLowerCase().includes(lower) ||
        (pt.scientific_name && pt.scientific_name.toLowerCase().includes(lower))
    );
  }, [plantTypes, plantTypeSearch]);
  
  function handleSelectPlantType(pt: PlantType) {
    setSelectedPlantType(pt);
    setPlantTypeSearch("");
    setPlantTypeDropdownOpen(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)} className="gap-1">
        <Plus className="h-4 w-4" />
        Add plant
      </Button>

      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl font-semibold">
            Add a new plant
          </AlertDialogTitle>
          <AlertDialogDescription>
            Select a plant type and give your plant a name.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Plant Type selector (required) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Plant type *</Label>
              <Link 
                href="/plant-types" 
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Browse catalog
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={plantTypeDropdownOpen}
                className="w-full justify-between font-normal"
                onClick={() => setPlantTypeDropdownOpen(!plantTypeDropdownOpen)}
              >
                {selectedPlantType ? (
                  <span className="truncate">{selectedPlantType.name}</span>
                ) : (
                  <span className="text-muted-foreground">Select plant type...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {plantTypeDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-0 shadow-md">
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Search plant types..."
                      value={plantTypeSearch}
                      onChange={(e) => setPlantTypeSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {filteredPlantTypes.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No plant types found
                      </p>
                    ) : (
                      filteredPlantTypes.map((pt) => (
                        <button
                          key={pt.id}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                            selectedPlantType?.id === pt.id && "bg-accent"
                          )}
                          onClick={() => handleSelectPlantType(pt)}
                        >
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            {selectedPlantType?.id === pt.id && (
                              <Check className="h-4 w-4" />
                            )}
                          </span>
                          <div className="flex flex-col items-start">
                            <span>{pt.name}</span>
                            {pt.scientific_name && (
                              <span className="text-xs text-muted-foreground italic">
                                {pt.scientific_name}
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

          {/* Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="add-name">Name *</Label>
            <Input
              id="add-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Living Room Pothos"
            />
          </div>

          {/* Nickname (optional) */}
          <div className="space-y-2">
            <Label htmlFor="add-nickname">Nickname (optional)</Label>
            <Input
              id="add-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Planty McPlantface"
            />
          </div>

          {/* Indoor/Outdoor toggle */}
          <div className="space-y-2">
            <Label>Environment</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={plantLocation === "indoor" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPlantLocation("indoor")}
                className="flex-1 gap-2"
              >
                <Home className="h-4 w-4" />
                Indoor
              </Button>
              <Button
                type="button"
                variant={plantLocation === "outdoor" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPlantLocation("outdoor")}
                className="flex-1 gap-2"
              >
                <TreePine className="h-4 w-4" />
                Outdoor
              </Button>
            </div>
          </div>

          {/* Location (optional) */}
          <div className="space-y-2">
            <Label htmlFor="add-location">Location (optional)</Label>
            <Input
              id="add-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Kitchen window, Bedroom shelf"
            />
          </div>

          {/* Light exposure (optional) */}
          <div className="space-y-2">
            <Label>Light exposure (optional)</Label>
            <Select value={lightExposure} onValueChange={(value) => setLightExposure(value || "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select light level">
                  {lightExposure ? getLightLabel(lightExposure) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {lightOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current size (optional) */}
          <div className="space-y-2">
            <Label>Current size (optional)</Label>
            <Select value={sizeCategory} onValueChange={(value) => setSizeCategory(value || "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select size">
                  {sizeCategory ? getSizeLabel(sizeCategory) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Acquired at (optional) */}
          <div className="space-y-2">
            <Label htmlFor="add-acquired">When did you get it? (optional)</Label>
            <Input
              id="add-acquired"
              type="date"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
            />
          </div>

          {/* How acquired (optional) */}
          <div className="space-y-2">
            <Label htmlFor="add-how-acquired">How did you get it? (optional)</Label>
            <Input
              id="add-how-acquired"
              value={howAcquired}
              onChange={(e) => setHowAcquired(e.target.value)}
              placeholder="e.g., Gift from mom, Found at farmers market"
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="add-description">About this plant (optional)</Label>
            <Textarea
              id="add-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story of this plant... How's it doing? Any quirks?"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {isPending ? "Adding..." : "Add plant"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
