"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Home, TreePine, Combine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createPlantType, updatePlantType } from "./actions";
import type { Tables } from "@/lib/supabase/database.types";

type PlantType = Tables<"plant_types">;

// Light options with numeric values for ordering
const lightOptions = [
  { value: "dark", label: "Dark", numeric: 1 },
  { value: "low_indirect", label: "Low Indirect", numeric: 2 },
  { value: "medium_indirect", label: "Medium Indirect", numeric: 3 },
  { value: "bright_indirect", label: "Bright Indirect", numeric: 4 },
  { value: "direct", label: "Direct", numeric: 5 },
];

// Size options with numeric values for ordering
const sizeOptions = [
  { value: "small", label: "Small", numeric: 1 },
  { value: "medium", label: "Medium", numeric: 2 },
  { value: "large", label: "Large", numeric: 3 },
  { value: "extra_large", label: "Extra Large", numeric: 4 },
];

const locationOptions = [
  { value: "indoor", label: "Indoor", icon: Home },
  { value: "outdoor", label: "Outdoor", icon: TreePine },
  { value: "both", label: "Both", icon: Combine },
];

// Helper functions to get labels from values
function getLightLabel(value: string): string {
  return lightOptions.find((opt) => opt.value === value)?.label || value;
}

function getSizeLabel(value: string): string {
  return sizeOptions.find((opt) => opt.value === value)?.label || value;
}

function getLightNumeric(value: string): number {
  return lightOptions.find((opt) => opt.value === value)?.numeric || 0;
}

function getSizeNumeric(value: string): number {
  return sizeOptions.find((opt) => opt.value === value)?.numeric || 0;
}

interface PlantTypeFormProps {
  plantType?: PlantType;
  mode: "create" | "edit";
  wikidataQid?: string | null;
  wikipediaTitle?: string | null;
}

export function PlantTypeForm({ plantType, mode, wikidataQid, wikipediaTitle }: PlantTypeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(plantType?.name || "");
  const [scientificName, setScientificName] = useState(plantType?.scientific_name || "");
  const [description, setDescription] = useState(plantType?.description || "");
  
  // Light range (min/max)
  const [lightMin, setLightMin] = useState(plantType?.light_min || "");
  const [lightMax, setLightMax] = useState(plantType?.light_max || "");
  
  // Size range (min/max)
  const [sizeMin, setSizeMin] = useState(plantType?.size_min || "");
  const [sizeMax, setSizeMax] = useState(plantType?.size_max || "");
  
  // Location preference
  const [locationPreference, setLocationPreference] = useState(plantType?.location_preference || "indoor");
  
  const [wateringDays, setWateringDays] = useState(plantType?.watering_frequency_days?.toString() || "");
  const [fertilizingDays, setFertilizingDays] = useState(plantType?.fertilizing_frequency_days?.toString() || "");
  const [careNotes, setCareNotes] = useState(plantType?.care_notes || "");
  
  // Validate that max >= min for light
  const isLightRangeValid = !lightMin || !lightMax || getLightNumeric(lightMax) >= getLightNumeric(lightMin);
  // Validate that max >= min for size
  const isSizeRangeValid = !sizeMin || !sizeMax || getSizeNumeric(sizeMax) >= getSizeNumeric(sizeMin);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Validate ranges
    if (!isLightRangeValid) {
      setError("Light max must be greater than or equal to light min");
      return;
    }
    if (!isSizeRangeValid) {
      setError("Size max must be greater than or equal to size min");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("scientific_name", scientificName);
    formData.set("description", description);
    formData.set("light_min", lightMin);
    formData.set("light_max", lightMax);
    formData.set("size_min", sizeMin);
    formData.set("size_max", sizeMax);
    formData.set("location_preference", locationPreference);
    formData.set("watering_frequency_days", wateringDays);
    formData.set("fertilizing_frequency_days", fertilizingDays);
    formData.set("care_notes", careNotes);
    
    // Include Wikidata fields if provided (for create from Wikidata flow)
    if (wikidataQid) {
      formData.set("wikidata_qid", wikidataQid);
    }
    if (wikipediaTitle) {
      formData.set("wikipedia_title", wikipediaTitle);
    }

    startTransition(async () => {
      let result;
      if (mode === "create") {
        result = await createPlantType(formData);
      } else {
        result = await updatePlantType(plantType!.id, formData);
      }

      if (result.success) {
        router.push("/admin/plant-types");
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
          <CardDescription>The plant's common and scientific names</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Common Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monstera"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scientific_name">Scientific Name</Label>
              <Input
                id="scientific_name"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="e.g., Monstera deliciosa"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this plant..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location</CardTitle>
          <CardDescription>Where this plant type can thrive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Environment</Label>
            <div className="flex gap-2">
              {locationOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={locationPreference === option.value ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setLocationPreference(option.value)}
                    className="flex-1 gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Care Requirements</CardTitle>
          <CardDescription>Recommended care settings for this plant type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Light Range */}
          <div className="space-y-2">
            <Label>Light Requirement Range</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select the minimum and maximum light levels this plant can tolerate
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="light-min" className="text-xs text-muted-foreground">Min</Label>
                <Select value={lightMin} onValueChange={(value) => setLightMin(value || "")}>
                  <SelectTrigger id="light-min" className="w-full">
                    <SelectValue placeholder="Select min light">
                      {lightMin ? getLightLabel(lightMin) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {lightOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="light-max" className="text-xs text-muted-foreground">Max</Label>
                <Select value={lightMax} onValueChange={(value) => setLightMax(value || "")}>
                  <SelectTrigger id="light-max" className={`w-full ${!isLightRangeValid ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select max light">
                      {lightMax ? getLightLabel(lightMax) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {lightOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!isLightRangeValid && (
              <p className="text-xs text-destructive">Max must be greater than or equal to min</p>
            )}
          </div>

          {/* Size Range */}
          <div className="space-y-2">
            <Label>Size Range</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select the minimum and maximum mature size for this plant type
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="size-min" className="text-xs text-muted-foreground">Min</Label>
                <Select value={sizeMin} onValueChange={(value) => setSizeMin(value || "")}>
                  <SelectTrigger id="size-min" className="w-full">
                    <SelectValue placeholder="Select min size">
                      {sizeMin ? getSizeLabel(sizeMin) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {sizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="size-max" className="text-xs text-muted-foreground">Max</Label>
                <Select value={sizeMax} onValueChange={(value) => setSizeMax(value || "")}>
                  <SelectTrigger id="size-max" className={`w-full ${!isSizeRangeValid ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select max size">
                      {sizeMax ? getSizeLabel(sizeMax) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {sizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!isSizeRangeValid && (
              <p className="text-xs text-destructive">Max must be greater than or equal to min</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="watering">Watering Frequency (days)</Label>
              <Input
                id="watering"
                type="number"
                min="1"
                max="365"
                value={wateringDays}
                onChange={(e) => setWateringDays(e.target.value)}
                placeholder="e.g., 7"
              />
              <p className="text-xs text-muted-foreground">Days between watering</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fertilizing">Fertilizing Frequency (days)</Label>
              <Input
                id="fertilizing"
                type="number"
                min="1"
                max="365"
                value={fertilizingDays}
                onChange={(e) => setFertilizingDays(e.target.value)}
                placeholder="e.g., 30"
              />
              <p className="text-xs text-muted-foreground">Days between fertilizing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Care Tips</CardTitle>
          <CardDescription>Additional care advice for plant owners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="care_notes">Care Notes</Label>
            <Textarea
              id="care_notes"
              value={careNotes}
              onChange={(e) => setCareNotes(e.target.value)}
              placeholder="Tips and advice for caring for this plant..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error and actions */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/plant-types")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name.trim() || !isLightRangeValid || !isSizeRangeValid}>
          {isPending 
            ? (mode === "create" ? "Creating..." : "Saving...") 
            : (mode === "create" ? "Create plant type" : "Save changes")}
        </Button>
      </div>
    </form>
  );
}
