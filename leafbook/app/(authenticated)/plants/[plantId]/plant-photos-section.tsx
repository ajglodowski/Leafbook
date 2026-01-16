"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import exifr from "exifr";
import { Camera, Trash2, Plus, Loader2, X, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createPlantPhoto, deletePlantPhoto, updatePlantPhotoMetadata, setPlantActivePhoto } from "./actions";

interface PlantPhoto {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string;
}

interface PlantPhotosSectionProps {
  plantId: string;
  plantName: string;
  photos: PlantPhoto[];
  activePhotoId: string | null;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Convert ISO date to datetime-local input value (local timezone)
function toDateTimeLocal(isoString: string): string {
  const date = new Date(isoString);
  // Format: YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Extract EXIF DateTimeOriginal from image file
async function getExifDate(file: File): Promise<Date | null> {
  try {
    const exifData = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });
    
    if (exifData?.DateTimeOriginal) {
      return new Date(exifData.DateTimeOriginal);
    }
    if (exifData?.CreateDate) {
      return new Date(exifData.CreateDate);
    }
    if (exifData?.ModifyDate) {
      return new Date(exifData.ModifyDate);
    }
    return null;
  } catch (error) {
    console.warn("Could not extract EXIF date:", error);
    return null;
  }
}

export function PlantPhotosSection({ plantId, plantName, photos, activePhotoId }: PlantPhotosSectionProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<PlantPhoto | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit photo state
  const [photoToEdit, setPhotoToEdit] = useState<PlantPhoto | null>(null);
  const [editTakenAt, setEditTakenAt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function handleSetActivePhoto(photoId: string) {
    startTransition(async () => {
      const result = await setPlantActivePhoto(plantId, photoId);
      if (!result.success) {
        setUploadError(result.error || "Failed to set active photo");
      }
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Try to extract EXIF date from the image
      const exifDate = await getExifDate(file);
      const takenAt = exifDate ? exifDate.toISOString() : new Date().toISOString();

      // Generate a unique ID for the upload and use it as the filename
      const photoId = crypto.randomUUID();
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${photoId}.${extension}`;

      // Upload to Vercel Blob
      const blob = await upload(filename, file, {
        access: "public",
        handleUploadUrl: "/api/blob/plant-photos",
        clientPayload: JSON.stringify({
          plantId,
        }),
      });

      // Create the database record via server action
      const result = await createPlantPhoto(plantId, {
        url: blob.url,
        caption: null,
        takenAt,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save photo");
      }

      // Refresh the page to show the new photo
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleDeleteClick(photo: PlantPhoto) {
    setPhotoToDelete(photo);
  }

  async function handleConfirmDelete() {
    if (!photoToDelete) return;

    startTransition(async () => {
      const result = await deletePlantPhoto(photoToDelete.id);
      if (!result.success) {
        setUploadError(result.error || "Failed to delete photo");
      }
      setPhotoToDelete(null);
    });
  }

  function handleEditClick(photo: PlantPhoto) {
    setPhotoToEdit(photo);
    setEditTakenAt(toDateTimeLocal(photo.taken_at));
    setEditCaption(photo.caption || "");
    setEditError(null);
  }

  function handleEditClose() {
    setPhotoToEdit(null);
    setEditTakenAt("");
    setEditCaption("");
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!photoToEdit) return;

    // Validate datetime
    if (!editTakenAt) {
      setEditError("Date and time is required");
      return;
    }

    const takenAtDate = new Date(editTakenAt);
    if (isNaN(takenAtDate.getTime())) {
      setEditError("Invalid date and time");
      return;
    }

    startTransition(async () => {
      const result = await updatePlantPhotoMetadata(photoToEdit.id, {
        takenAt: takenAtDate.toISOString(),
        caption: editCaption.trim() || null,
      });

      if (result.success) {
        handleEditClose();
        router.refresh();
      } else {
        setEditError(result.error || "Failed to save changes");
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-5 w-5" />
                Photos
              </CardTitle>
              <CardDescription>
                {photos.length === 0
                  ? "No photos yet"
                  : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
                disabled={isUploading}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add photo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {uploadError && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {uploadError}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-auto p-0"
                onClick={() => setUploadError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((photo) => {
                const isActive = photo.id === activePhotoId;
                return (
                  <div
                    key={photo.id}
                    className={`group relative aspect-square overflow-hidden rounded-lg bg-muted ${
                      isActive ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption || `${plantName} photo`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                    {/* Active badge */}
                    {isActive && (
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        <Star className="h-3 w-3 fill-current" />
                        Active
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                      <div className="flex justify-end gap-1">
                        {!isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => handleSetActivePhoto(photo.id)}
                            disabled={isPending}
                          >
                            <Star className="h-3 w-3" />
                            Set active
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditClick(photo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteClick(photo)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-white">
                        {formatDateTime(photo.taken_at)}
                        {photo.caption && (
                          <p className="mt-1 line-clamp-2">{photo.caption}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Camera className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No photos yet</p>
              <p className="text-sm">Add your first photo to capture this plant&apos;s journey!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!photoToDelete} onOpenChange={() => setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The photo will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit photo dialog */}
      <AlertDialog open={!!photoToEdit} onOpenChange={(open) => !open && handleEditClose()}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit photo details</AlertDialogTitle>
            <AlertDialogDescription>
              Update when this photo was taken and add a caption to remember the moment.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {photoToEdit && (
            <div className="space-y-4">
              {/* Photo preview */}
              <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={photoToEdit.url}
                  alt={photoToEdit.caption || `${plantName} photo`}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>

              {/* Date/time input */}
              <div className="space-y-2">
                <Label htmlFor="edit-taken-at">Date and time</Label>
                <Input
                  id="edit-taken-at"
                  type="datetime-local"
                  value={editTakenAt}
                  onChange={(e) => setEditTakenAt(e.target.value)}
                />
              </div>

              {/* Caption input */}
              <div className="space-y-2">
                <Label htmlFor="edit-caption">Caption (optional)</Label>
                <Textarea
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="What's happening in this photo?"
                  rows={3}
                />
              </div>

              {editError && (
                <p className="text-sm text-destructive">{editError}</p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleEditClose}>Cancel</AlertDialogCancel>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
