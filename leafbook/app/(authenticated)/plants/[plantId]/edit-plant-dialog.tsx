"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Home, TreePine, Trash2 } from "lucide-react";
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
import { updatePlant, deletePlant } from "./actions";

interface PlantData {
  id: string;
  name: string;
  nickname: string | null;
  is_indoor: boolean;
  location: string | null;
  light_exposure: string | null;
  how_acquired: string | null;
  description: string | null;
  acquired_at: string | null;
}

const lightOptions = [
  { value: "dark", label: "Dark" },
  { value: "low_indirect", label: "Low Indirect" },
  { value: "medium_indirect", label: "Medium Indirect" },
  { value: "bright_indirect", label: "Bright Indirect" },
  { value: "direct", label: "Direct" },
];

// Helper to get label from value
function getLightLabel(value: string): string {
  return lightOptions.find((opt) => opt.value === value)?.label || value;
}

export function EditPlantDialog({ plant }: { plant: PlantData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [name, setName] = useState(plant.name);
  const [nickname, setNickname] = useState(plant.nickname || "");
  const [isIndoor, setIsIndoor] = useState(plant.is_indoor);
  const [location, setLocation] = useState(plant.location || "");
  const [lightExposure, setLightExposure] = useState(plant.light_exposure || "");
  const [howAcquired, setHowAcquired] = useState(plant.how_acquired || "");
  const [description, setDescription] = useState(plant.description || "");
  const [acquiredAt, setAcquiredAt] = useState(
    plant.acquired_at ? plant.acquired_at.split("T")[0] : ""
  );
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(plant.name);
      setNickname(plant.nickname || "");
      setIsIndoor(plant.is_indoor);
      setLocation(plant.location || "");
      setLightExposure(plant.light_exposure || "");
      setHowAcquired(plant.how_acquired || "");
      setDescription(plant.description || "");
      setAcquiredAt(plant.acquired_at ? plant.acquired_at.split("T")[0] : "");
      setError(null);
    }
  }, [isOpen, plant]);

  async function handleSubmit() {
    setError(null);
    
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    startTransition(async () => {
      const result = await updatePlant(plant.id, {
        name: name.trim(),
        nickname: nickname.trim() || null,
        is_indoor: isIndoor,
        location: location.trim() || null,
        light_exposure: lightExposure || null,
        how_acquired: howAcquired.trim() || null,
        description: description.trim() || null,
        acquired_at: acquiredAt || null,
      });

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
      const result = await deletePlant(plant.id);
      if (result.success) {
        router.push("/plants");
      } else {
        setError(result.error || "Could not delete plant");
        setShowDeleteConfirm(false);
      }
    });
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <Button variant="outline" onClick={() => setIsOpen(true)} className="gap-1">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl font-semibold">
              Edit plant
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update your plant's details and story.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Living Room Pothos"
              />
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="edit-nickname">Nickname (optional)</Label>
              <Input
                id="edit-nickname"
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
                  variant={isIndoor ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsIndoor(true)}
                  className="flex-1 gap-2"
                >
                  <Home className="h-4 w-4" />
                  Indoor
                </Button>
                <Button
                  type="button"
                  variant={!isIndoor ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsIndoor(false)}
                  className="flex-1 gap-2"
                >
                  <TreePine className="h-4 w-4" />
                  Outdoor
                </Button>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location (optional)</Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Kitchen window, Bedroom shelf"
              />
            </div>

            {/* Light exposure */}
            <div className="space-y-2">
              <Label>Light exposure (optional)</Label>
              <Select value={lightExposure} onValueChange={setLightExposure}>
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

            {/* Acquired at */}
            <div className="space-y-2">
              <Label htmlFor="edit-acquired">When did you get it? (optional)</Label>
              <Input
                id="edit-acquired"
                type="date"
                value={acquiredAt}
                onChange={(e) => setAcquiredAt(e.target.value)}
              />
            </div>

            {/* How acquired */}
            <div className="space-y-2">
              <Label htmlFor="edit-how-acquired">How did you get it? (optional)</Label>
              <Input
                id="edit-how-acquired"
                value={howAcquired}
                onChange={(e) => setHowAcquired(e.target.value)}
                placeholder="e.g., Gift from mom, Found at farmers market"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">About this plant (optional)</Label>
              <Textarea
                id="edit-description"
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

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1 sm:mr-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete plant
            </Button>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{plant.name}" from your collection. The plant's care history will be preserved but hidden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep plant</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
