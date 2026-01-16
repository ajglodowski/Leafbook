"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from "./actions";

interface JournalEntryData {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
}

interface JournalEntryDialogProps {
  plantId: string;
  plantName: string;
  entry?: JournalEntryData; // If provided, we're editing; otherwise creating
  trigger?: React.ReactNode;
}

export function JournalEntryDialog({
  plantId,
  plantName,
  entry,
  trigger,
}: JournalEntryDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!entry;

  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [entryAt, setEntryAt] = useState(
    entry?.entry_date
      ? entry.entry_date.split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle(entry?.title || "");
      setContent(entry?.content || "");
      setEntryAt(
        entry?.entry_date
          ? entry.entry_date.split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setError(null);
    }
  }, [isOpen, entry]);

  async function handleSubmit() {
    setError(null);

    if (!content.trim()) {
      setError("Please write something about your plant");
      return;
    }

    startTransition(async () => {
      let result;

      if (isEditing && entry) {
        result = await updateJournalEntry(entry.id, {
          title: title.trim() || null,
          content: content.trim(),
          entryAt,
        });
      } else {
        result = await createJournalEntry(plantId, {
          title: title.trim() || null,
          content: content.trim(),
          entryAt,
        });
      }

      if (result.success) {
        setIsOpen(false);
        // Reset form for next use
        setTitle("");
        setContent("");
        setEntryAt(new Date().toISOString().split("T")[0]);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  async function handleDelete() {
    if (!entry) return;

    startTransition(async () => {
      const result = await deleteJournalEntry(entry.id);
      if (result.success) {
        setIsOpen(false);
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        setError(result.error || "Could not delete entry");
        setShowDeleteConfirm(false);
      }
    });
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger ? (
          <div onClick={() => setIsOpen(true)} className="cursor-pointer">
            {trigger}
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsOpen(true)} className="gap-1.5">
            <PenLine className="h-4 w-4" />
            Write in journal
          </Button>
        )}

        <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl font-semibold">
              {isEditing ? "Edit journal entry" : "New journal entry"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEditing
                ? `Update your thoughts about ${plantName}.`
                : `Write about ${plantName} — observations, milestones, or how it makes you feel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Title (optional) */}
            <div className="space-y-2">
              <Label htmlFor="journal-title">Title (optional)</Label>
              <Input
                id="journal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., First new leaf!, Repotting day"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="journal-content">Your thoughts *</Label>
              <Textarea
                id="journal-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening with your plant? How does it look? Any changes you've noticed?"
                rows={5}
                className="min-h-[120px]"
              />
            </div>

            {/* Entry date */}
            <div className="space-y-2">
              <Label htmlFor="journal-date" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date
              </Label>
              <Input
                id="journal-date"
                type="date"
                value={entryAt}
                onChange={(e) => setEntryAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Backdate if you're writing about something that happened earlier
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-1 sm:mr-auto"
              >
                <Trash2 className="h-4 w-4" />
                Delete entry
              </Button>
            )}
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleSubmit} disabled={isPending || !content.trim()}>
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                ? "Save changes"
                : "Add entry"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete journal entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this entry from {plantName}'s story. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep entry</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
