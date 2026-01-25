"use client";

import { Archive, ArchiveRestore, ImagePlus, MoreHorizontal, Package, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { deletePot, retirePot, unretirePot, updatePot } from "./actions";
import { PotDialog } from "./pot-dialog";
import { PotPhotoDialog } from "./pot-photo-dialog";

interface Pot {
  id: string;
  name: string;
  size_inches: number | null;
  material: string | null;
  has_drainage: boolean;
  color: string | null;
  notes: string | null;
  photo_url: string | null;
  is_retired: boolean;
}

interface PotActionsProps {
  pot: Pot;
}

export function PotActions({ pot }: PotActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRetire() {
    startTransition(async () => {
      if (pot.is_retired) {
        await unretirePot(pot.id);
      } else {
        await retirePot(pot.id);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePot(pot.id);
      setShowDeleteDialog(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPhotoDialog(true)}>
            <ImagePlus className="h-4 w-4" />
            {pot.photo_url ? "Change photo" : "Add photo"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleRetire} disabled={isPending}>
            {pot.is_retired ? (
              <>
                <ArchiveRestore className="h-4 w-4" />
                Restore
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                Retire
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      {showEditDialog && (
        <PotDialog
          pot={pot}
          trigger={<span className="hidden" />}
        />
      )}
      
      {/* Workaround: render dialog separately with controlled state */}
      <PotDialogControlled
        pot={pot}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      {/* Photo dialog */}
      <PotPhotoDialog
        pot={pot}
        open={showPhotoDialog}
        onOpenChange={setShowPhotoDialog}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pot.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this pot from your collection. Plants
              currently in this pot will no longer be associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Controlled version of PotDialog for external state management
function PotDialogControlled({
  pot,
  open,
  onOpenChange,
}: {
  pot: Pot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: pot.name,
    size_inches: pot.size_inches,
    material: pot.material || "",
    has_drainage: pot.has_drainage,
    color: pot.color || "",
    notes: pot.notes || "",
  });

  // Reset form when dialog opens
  if (open && formData.name !== pot.name) {
    setFormData({
      name: pot.name,
      size_inches: pot.size_inches,
      material: pot.material || "",
      has_drainage: pot.has_drainage,
      color: pot.color || "",
      notes: pot.notes || "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updatePot(pot.id, formData);
      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Package className="h-5 w-5" />
            Edit pot
          </DialogTitle>
          <DialogDescription>
            Update the details of this pot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-size">Size (inches)</Label>
              <Input
                id="edit-size"
                type="number"
                step="0.5"
                min="0"
                value={formData.size_inches ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    size_inches: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-material">Material</Label>
              <Input
                id="edit-material"
                value={formData.material}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, material: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-color">Color</Label>
            <Input
              id="edit-color"
              value={formData.color}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-drainage"
              checked={formData.has_drainage}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, has_drainage: checked === true })
              }
            />
            <Label htmlFor="edit-drainage" className="font-normal cursor-pointer">
              Has drainage hole
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
