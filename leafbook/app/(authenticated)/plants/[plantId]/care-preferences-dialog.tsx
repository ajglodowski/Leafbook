"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Droplets, Sparkles, RotateCcw } from "lucide-react";
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
import { upsertPlantCarePreferences } from "./actions";

interface CarePreferencesDialogProps {
  plantId: string;
  plantName: string;
  // Current effective values (from view, includes fallbacks)
  effectiveWateringDays: number | null;
  effectiveFertilizingDays: number | null;
  // User's custom overrides (null if using recommended/default)
  customWateringDays: number | null;
  customFertilizingDays: number | null;
  // Recommended values from plant type (null if no plant type)
  recommendedWateringDays: number | null;
  recommendedFertilizingDays: number | null;
}

export function CarePreferencesDialog({
  plantId,
  plantName,
  effectiveWateringDays,
  effectiveFertilizingDays,
  customWateringDays,
  customFertilizingDays,
  recommendedWateringDays,
  recommendedFertilizingDays,
}: CarePreferencesDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [wateringDays, setWateringDays] = useState<string>(
    customWateringDays?.toString() || ""
  );
  const [fertilizingDays, setFertilizingDays] = useState<string>(
    customFertilizingDays?.toString() || ""
  );
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setWateringDays(customWateringDays?.toString() || "");
      setFertilizingDays(customFertilizingDays?.toString() || "");
      setError(null);
    }
  }, [isOpen, customWateringDays, customFertilizingDays]);

  // Helper to get the fallback description
  function getWateringFallback(): string {
    if (recommendedWateringDays) {
      return `Recommended: ${recommendedWateringDays} days`;
    }
    return "Default: 7 days";
  }

  function getFertilizingFallback(): string {
    if (recommendedFertilizingDays) {
      return `Recommended: ${recommendedFertilizingDays} days`;
    }
    return "Default: 30 days";
  }

  async function handleSubmit() {
    setError(null);

    // Parse and validate
    const wateringValue = wateringDays.trim() ? parseInt(wateringDays, 10) : null;
    const fertilizingValue = fertilizingDays.trim() ? parseInt(fertilizingDays, 10) : null;

    if (wateringValue !== null && (isNaN(wateringValue) || wateringValue < 1 || wateringValue > 365)) {
      setError("Watering frequency must be between 1 and 365 days");
      return;
    }

    if (fertilizingValue !== null && (isNaN(fertilizingValue) || fertilizingValue < 1 || fertilizingValue > 365)) {
      setError("Fertilizing frequency must be between 1 and 365 days");
      return;
    }

    startTransition(async () => {
      const result = await upsertPlantCarePreferences(plantId, {
        watering_frequency_days: wateringValue,
        fertilizing_frequency_days: fertilizingValue,
      });

      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  function handleReset() {
    setWateringDays("");
    setFertilizingDays("");
  }

  const hasCustomValues = customWateringDays !== null || customFertilizingDays !== null;
  const hasChanges =
    wateringDays !== (customWateringDays?.toString() || "") ||
    fertilizingDays !== (customFertilizingDays?.toString() || "");

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1 text-muted-foreground hover:text-foreground"
      >
        <Settings2 className="h-4 w-4" />
        Customize
      </Button>

      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl font-semibold">
            Care schedule for {plantName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Set custom watering and fertilizing frequencies for this plant. Leave
            blank to use the recommended schedule.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Watering frequency */}
          <div className="space-y-2">
            <Label htmlFor="watering-days" className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Water every (days)
            </Label>
            <Input
              id="watering-days"
              type="number"
              min={1}
              max={365}
              value={wateringDays}
              onChange={(e) => setWateringDays(e.target.value)}
              placeholder={effectiveWateringDays?.toString() || "7"}
            />
            <p className="text-xs text-muted-foreground">{getWateringFallback()}</p>
          </div>

          {/* Fertilizing frequency */}
          <div className="space-y-2">
            <Label htmlFor="fertilizing-days" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Fertilize every (days)
            </Label>
            <Input
              id="fertilizing-days"
              type="number"
              min={1}
              max={365}
              value={fertilizingDays}
              onChange={(e) => setFertilizingDays(e.target.value)}
              placeholder={effectiveFertilizingDays?.toString() || "30"}
            />
            <p className="text-xs text-muted-foreground">{getFertilizingFallback()}</p>
          </div>

          {/* Reset to recommended button */}
          {(wateringDays || fertilizingDays) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Use recommended schedule
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !hasChanges}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
