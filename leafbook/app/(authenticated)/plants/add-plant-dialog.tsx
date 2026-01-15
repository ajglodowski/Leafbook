"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Home, TreePine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { createPlant } from "./actions";

export function AddPlantDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isIndoor, setIsIndoor] = useState(true);
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setLocation("");
      setIsIndoor(true);
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit() {
    setError(null);
    
    const formData = new FormData();
    formData.set("name", name);
    formData.set("isIndoor", isIndoor.toString());
    if (location) formData.set("location", location);

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

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)} className="gap-1">
        <Plus className="h-4 w-4" />
        Add plant
      </Button>

      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl font-semibold">
            Add a new plant
          </AlertDialogTitle>
          <AlertDialogDescription>
            Give your plant a name and tell us where it lives. You can link it to a plant type later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="plant-name">Name *</Label>
            <Input
              id="plant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Living Room Pothos"
              autoFocus
            />
          </div>

          {/* Location input */}
          <div className="space-y-2">
            <Label htmlFor="plant-location">Location (optional)</Label>
            <Input
              id="plant-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Kitchen window, Bedroom shelf"
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "Adding..." : "Add plant"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
