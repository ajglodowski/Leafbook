"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createPlantType, updatePlantType } from "./actions";
import type { Tables } from "@/lib/supabase/database.types";

type PlantType = Tables<"plant_types">;

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

// Helper functions to get labels from values
function getLightLabel(value: string): string {
  return lightOptions.find((opt) => opt.value === value)?.label || value;
}

function getSizeLabel(value: string): string {
  return sizeOptions.find((opt) => opt.value === value)?.label || value;
}

interface PlantTypeFormProps {
  plantType?: PlantType;
  mode: "create" | "edit";
}

export function PlantTypeForm({ plantType, mode }: PlantTypeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(plantType?.name || "");
  const [scientificName, setScientificName] = useState(plantType?.scientific_name || "");
  const [description, setDescription] = useState(plantType?.description || "");
  const [lightRequirement, setLightRequirement] = useState(plantType?.light_requirement || "");
  const [wateringDays, setWateringDays] = useState(plantType?.watering_frequency_days?.toString() || "");
  const [fertilizingDays, setFertilizingDays] = useState(plantType?.fertilizing_frequency_days?.toString() || "");
  const [sizeCategory, setSizeCategory] = useState(plantType?.size_category || "");
  const [careNotes, setCareNotes] = useState(plantType?.care_notes || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("scientific_name", scientificName);
    formData.set("description", description);
    formData.set("light_requirement", lightRequirement);
    formData.set("watering_frequency_days", wateringDays);
    formData.set("fertilizing_frequency_days", fertilizingDays);
    formData.set("size_category", sizeCategory);
    formData.set("care_notes", careNotes);

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

      {/* Care requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Care Requirements</CardTitle>
          <CardDescription>Recommended care settings for this plant type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="light">Light Requirement</Label>
              <Select value={lightRequirement} onValueChange={setLightRequirement}>
                <SelectTrigger id="light" className="w-full">
                  <SelectValue placeholder="Select light level">
                    {lightRequirement ? getLightLabel(lightRequirement) : null}
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
            <div className="space-y-2">
              <Label htmlFor="size">Size Category</Label>
              <Select value={sizeCategory} onValueChange={setSizeCategory}>
                <SelectTrigger id="size" className="w-full">
                  <SelectValue placeholder="Select size">
                    {sizeCategory ? getSizeLabel(sizeCategory) : null}
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
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending 
            ? (mode === "create" ? "Creating..." : "Saving...") 
            : (mode === "create" ? "Create plant type" : "Save changes")}
        </Button>
      </div>
    </form>
  );
}
