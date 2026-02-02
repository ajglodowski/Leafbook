"use client";

import { Calendar, Check, MapPin } from "lucide-react";
import { type ReactNode, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { logMoveEvent, updateMoveEvent } from "./actions";

interface MoveDialogProps {
  plantId: string;
  plantName: string;
  currentLocation: string | null;
  initialEvent?: {
    id: string;
    eventDate: string;
    toLocation: string | null;
    notes?: string | null;
  } | null;
  trigger?: ReactNode;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function MoveDialog({
  plantId,
  plantName,
  currentLocation,
  initialEvent = null,
  trigger,
}: MoveDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [isDone, setIsDone] = useState(false);
  const isEditing = !!initialEvent;

  useEffect(() => {
    if (open) {
      setSelectedDate(
        initialEvent?.eventDate
          ? formatDateForInput(new Date(initialEvent.eventDate))
          : formatDateForInput(new Date())
      );
      setDestination(initialEvent?.toLocation ?? "");
      setNotes(initialEvent?.notes ?? "");
      setError(null);
      setIsDone(false);
    }
  }, [open, initialEvent]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = isEditing && initialEvent
        ? await updateMoveEvent(initialEvent.id, {
            eventDate: selectedDate,
            toLocation: destination,
            notes,
          })
        : await logMoveEvent(plantId, {
            eventDate: selectedDate,
            toLocation: destination,
            notes,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1">
            <MapPin className="h-4 w-4" />
            Move
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <MapPin className="h-5 w-5 text-indigo-500" />
            {isEditing ? `Edit move for ${plantName}` : `Move ${plantName}`}
          </DialogTitle>
          <DialogDescription>
            {currentLocation
              ? `Update where ${plantName} lives now.`
              : `Set ${plantName}'s first location.`}
          </DialogDescription>
        </DialogHeader>

        {isDone ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium text-green-600">Moved!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="move-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                When did you move it?
              </Label>
              <Input
                id="move-date"
                type="date"
                value={selectedDate}
                max={formatDateForInput(new Date())}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            {currentLocation && !isEditing && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Current location:</span> {currentLocation}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="move-destination">New location</Label>
              <Input
                id="move-destination"
                value={destination}
                placeholder={currentLocation || "e.g. Living room window"}
                onChange={(event) => setDestination(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="move-notes">Notes (optional)</Label>
              <Textarea
                id="move-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Any extra details about the move."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save move"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
