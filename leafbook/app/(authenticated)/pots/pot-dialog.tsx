"use client";

import { useState, useTransition, ReactNode } from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createPot, updatePot, type PotData } from "./actions";

interface Pot {
  id: string;
  name: string;
  size_inches: number | null;
  material: string | null;
  has_drainage: boolean;
  color: string | null;
  notes: string | null;
}

interface PotDialogProps {
  pot?: Pot;
  trigger?: ReactNode;
}

export function PotDialog({ pot, trigger }: PotDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!pot;

  const [formData, setFormData] = useState<PotData>({
    name: pot?.name || "",
    size_inches: pot?.size_inches || null,
    material: pot?.material || "",
    has_drainage: pot?.has_drainage ?? true,
    color: pot?.color || "",
    notes: pot?.notes || "",
  });

  function resetForm() {
    setFormData({
      name: pot?.name || "",
      size_inches: pot?.size_inches || null,
      material: pot?.material || "",
      has_drainage: pot?.has_drainage ?? true,
      color: pot?.color || "",
      notes: pot?.notes || "",
    });
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = isEditing
        ? await updatePot(pot.id, formData)
        : await createPot(formData);

      if (result.success) {
        setOpen(false);
        if (!isEditing) {
          resetForm();
        }
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Add pot
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Package className="h-5 w-5" />
            {isEditing ? "Edit pot" : "Add a pot"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this pot."
              : "Add a pot to your collection for tracking repots."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Terracotta 6-inch"
              required
            />
          </div>

          {/* Size and Material row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size (inches)</Label>
              <Input
                id="size"
                type="number"
                step="0.5"
                min="0"
                value={formData.size_inches ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    size_inches: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={formData.material || ""}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="Terracotta"
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={formData.color || ""}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Red-brown"
            />
          </div>

          {/* Has drainage */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="drainage"
              checked={formData.has_drainage}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, has_drainage: checked === true })
              }
            />
            <Label htmlFor="drainage" className="font-normal cursor-pointer">
              Has drainage hole
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save changes" : "Add pot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
