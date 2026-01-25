"use client";

import { Home, Plus, TreePine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

import { addPlant } from "./actions";

interface AddPlantButtonProps {
  plantTypeId: string;
  plantTypeName: string;
}

export function AddPlantButton({ plantTypeId, plantTypeName }: AddPlantButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(plantTypeName);
  const [isIndoor, setIsIndoor] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    
    const formData = new FormData();
    formData.set("plantTypeId", plantTypeId);
    formData.set("name", name);
    formData.set("isIndoor", isIndoor.toString());

    startTransition(async () => {
      const result = await addPlant(formData);
      if (result.success) {
        setIsOpen(false);
        router.push("/plants");
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add to my plants
      </Button>

      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl font-semibold">
            Add {plantTypeName} to your collection
          </AlertDialogTitle>
          <AlertDialogDescription>
            Give your new plant a name. You can always change this later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="plant-name">Name</Label>
            <Input
              id="plant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My lovely plant"
              autoFocus
            />
          </div>

          {/* Indoor/Outdoor toggle */}
          <div className="space-y-2">
            <Label>Location</Label>
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
