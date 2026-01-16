"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { Sprout, Package, Calendar, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logRepotEvent } from "./actions";
import { cn } from "@/lib/utils";

interface Pot {
  id: string;
  name: string;
  size_inches: number | null;
  material: string | null;
  photo_url: string | null;
  is_retired: boolean;
}

interface RepotDialogProps {
  plantId: string;
  plantName: string;
  currentPotId: string | null;
  pots: Pot[];
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function RepotDialog({ plantId, plantName, currentPotId, pots }: RepotDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  // Filter to only active pots that aren't the current pot
  const availablePots = pots.filter(p => !p.is_retired && p.id !== currentPotId);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDate(formatDateForInput(new Date()));
      setSelectedPotId(null);
      setError(null);
      setIsDone(false);
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await logRepotEvent(plantId, {
        eventDate: selectedDate,
        fromPotId: currentPotId,
        toPotId: selectedPotId,
      });

      if (result.success) {
        setIsDone(true);
        setTimeout(() => {
          setOpen(false);
          setIsDone(false);
        }, 1500);
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  const currentPot = currentPotId ? pots.find(p => p.id === currentPotId) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Sprout className="h-4 w-4" />
          Repot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Sprout className="h-5 w-5 text-orange-500" />
            Repot {plantName}
          </DialogTitle>
          <DialogDescription>
            Log when you moved this plant to a new pot.
          </DialogDescription>
        </DialogHeader>

        {isDone ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium text-green-600">Repotted!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="repot-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                When did you repot?
              </Label>
              <Input
                id="repot-date"
                type="date"
                value={selectedDate}
                max={formatDateForInput(new Date())}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Current pot display */}
            {currentPot && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Current pot</p>
                <div className="flex items-center gap-3">
                  {currentPot.photo_url ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={currentPot.photo_url}
                        alt={currentPot.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{currentPot.name}</p>
                    {currentPot.size_inches && (
                      <p className="text-xs text-muted-foreground">{currentPot.size_inches}" {currentPot.material || ""}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* New pot selection - inline list */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                New pot (optional)
              </Label>
              
              {availablePots.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-lg border">
                  {/* No pot option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPotId(null)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 border-b",
                      selectedPotId === null && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-muted-foreground">No pot selected</p>
                      <p className="text-xs text-muted-foreground">Just log the repot event</p>
                    </div>
                    {selectedPotId === null && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                  
                  {/* Pot options */}
                  {availablePots.map((pot, index) => (
                    <button
                      key={pot.id}
                      type="button"
                      onClick={() => setSelectedPotId(pot.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                        index < availablePots.length - 1 && "border-b",
                        selectedPotId === pot.id && "bg-primary/5"
                      )}
                    >
                      {pot.photo_url ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={pot.photo_url}
                            alt={pot.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{pot.name}</p>
                        {(pot.size_inches || pot.material) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {[
                              pot.size_inches ? `${pot.size_inches}"` : null,
                              pot.material,
                            ].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {selectedPotId === pot.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No other pots in your collection</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/pots", "_blank")}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add pots
                  </Button>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-1 bg-orange-500 hover:bg-orange-600">
                {isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Sprout className="h-4 w-4" />
                    Log repot
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
