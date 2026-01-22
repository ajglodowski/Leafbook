"use client";

import { useState, useTransition } from "react";
import { Archive, RotateCcw, Calendar } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { markPlantAsLegacy, restorePlantFromLegacy } from "./actions";

interface LegacyDialogProps {
  plantId: string;
  plantName: string;
  isLegacy: boolean;
  legacyReason?: string | null;
  legacyAt?: string | null;
}

export function LegacyDialog({
  plantId,
  plantName,
  isLegacy,
  legacyReason,
  legacyAt,
}: LegacyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  const handleMarkAsLegacy = () => {
    if (!reason.trim()) return;

    startTransition(async () => {
      const result = await markPlantAsLegacy(plantId, {
        reason: reason.trim(),
        legacyAt: new Date(date).toISOString(),
      });

      if (result.success) {
        setOpen(false);
        setReason("");
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      const result = await restorePlantFromLegacy(plantId);

      if (result.success) {
        setOpen(false);
      }
    });
  };

  if (isLegacy) {
    // Show restore dialog
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restore
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Restore {plantName}?</DialogTitle>
            <DialogDescription>
              This will move the plant back to your active collection. Care actions will be re-enabled.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {plantName} was marked as legacy
              {legacyAt && (
                <>
                  {" "}on{" "}
                  {new Date(legacyAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </>
              )}
              {legacyReason && (
                <>
                  {" "}with the note: <em>&ldquo;{legacyReason}&rdquo;</em>
                </>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={isPending}>
              {isPending ? "Restoring..." : "Restore to Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show mark as legacy dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Archive className="h-4 w-4" />
          Mark as Legacy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark {plantName} as Legacy</DialogTitle>
          <DialogDescription>
            Legacy plants are no longer in your active collection. Their history, photos, and journal entries will be preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Why is this plant becoming legacy? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Died from root rot, Given to a friend, Moved to a new home..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legacy-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="legacy-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMarkAsLegacy}
            disabled={isPending || !reason.trim()}
          >
            {isPending ? "Saving..." : "Mark as Legacy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
