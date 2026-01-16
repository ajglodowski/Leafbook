"use client";

import { useState, useTransition, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import exifr from "exifr";
import { Camera, Trash2, Plus, Loader2, X, Pencil, Star, Sparkles, ImagePlus } from "lucide-react";
import { ImageCropper } from "@/components/ui/image-cropper";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Generate consistent rotation angles based on photo id
function getRotation(photoId: string, index: number): number {
  // Use a simple hash of the id to get a consistent rotation
  const hash = photoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rotations = [-6, -4, -2, 2, 4, 6, -5, 3, -3, 5];
  return rotations[(hash + index) % rotations.length];
}

function formatPolaroidDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

// Polaroid photo component
function PolaroidPhoto({
  photo,
  plantName,
  rotation,
  isActive,
  isFeatured,
  onSetActive,
  onEdit,
  onDelete,
  isPending,
}: {
  photo: PlantPhoto;
  plantName: string;
  rotation: number;
  isActive: boolean;
  isFeatured?: boolean;
  onSetActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className={`group relative transition-all duration-300 hover:z-10 ${
        isFeatured ? "hover:scale-[1.02]" : "hover:scale-105 hover:rotate-0"
      }`}
      style={{ 
        transform: isFeatured ? undefined : `rotate(${rotation}deg)`,
      }}
    >
      {/* Polaroid frame - cream/off-white color */}
      <div className={`bg-amber-50 dark:bg-amber-100/90 p-2 pb-12 shadow-lg rounded-sm ${
        isFeatured ? "p-3 pb-16 sm:p-4 sm:pb-20" : ""
      } ${isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
        {/* Photo - always square */}
        <div className="relative overflow-hidden bg-stone-200 aspect-square">
          <Image
            src={photo.url}
            alt={photo.caption || `${plantName} photo`}
            fill
            className="object-cover"
            sizes={isFeatured ? "(max-width: 768px) 100vw, 600px" : "200px"}
          />
          
          {/* Active badge for featured */}
          {isActive && isFeatured && (
            <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </div>
          )}

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            {!isActive && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 shadow-lg gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetActive();
                }}
                disabled={isPending}
              >
                <Star className="h-3 w-3" />
                Feature
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Polaroid caption area - handwritten style */}
        <div className={`absolute bottom-0 left-0 right-0 px-3 pb-2 ${isFeatured ? "px-4 pb-3 sm:px-5 sm:pb-4" : ""}`}>
          <p className={`font-handwritten text-stone-700 dark:text-stone-800 ${
            isFeatured ? "text-xl sm:text-2xl" : "text-base"
          }`}>
            {formatPolaroidDate(photo.taken_at)}
          </p>
          {photo.caption && (
            <p className={`font-handwritten text-stone-600 dark:text-stone-700 truncate ${
              isFeatured ? "text-lg sm:text-xl mt-0.5" : "text-sm"
            }`}>
              {photo.caption}
            </p>
          )}
        </div>
      </div>

      {/* Tape effect for non-featured */}
      {!isFeatured && (
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-amber-200/70 dark:bg-amber-300/60 rotate-2 shadow-sm"
          style={{ transform: `translateX(-50%) rotate(${-rotation * 0.5}deg)` }}
        />
      )}
    </div>
  );
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

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageUrl, setCropperImageUrl] = useState<string | null>(null);
  const [pendingExifDate, setPendingExifDate] = useState<Date | null>(null);

  // Find the active photo
  const activePhoto = activePhotoId 
    ? photos.find(p => p.id === activePhotoId) 
    : photos[0];
  const otherPhotos = photos.filter(p => p.id !== activePhoto?.id);

  // Memoize rotations so they don't change on re-render
  const photoRotations = useMemo(() => {
    const rotations: Record<string, number> = {};
    photos.forEach((photo, index) => {
      rotations[photo.id] = getRotation(photo.id, index);
    });
    return rotations;
  }, [photos]);

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

    setUploadError(null);

    try {
      // Get EXIF date before cropping
      const exifDate = await getExifDate(file);
      setPendingExifDate(exifDate);

      // Create a URL for the cropper
      const imageUrl = URL.createObjectURL(file);
      setCropperImageUrl(imageUrl);
      setShowCropper(true);
    } catch (error) {
      console.error("Error preparing image:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to prepare image");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const takenAt = pendingExifDate ? pendingExifDate.toISOString() : new Date().toISOString();

      const photoId = crypto.randomUUID();
      const filename = `${photoId}.jpg`;

      // Create a File from the Blob for upload
      const croppedFile = new File([croppedBlob], filename, { type: "image/jpeg" });

      const blob = await upload(filename, croppedFile, {
        access: "public",
        handleUploadUrl: "/api/blob/plant-photos",
        clientPayload: JSON.stringify({
          plantId,
        }),
      });

      const result = await createPlantPhoto(plantId, {
        url: blob.url,
        caption: null,
        takenAt,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save photo");
      }

      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Clean up
      if (cropperImageUrl) {
        URL.revokeObjectURL(cropperImageUrl);
      }
      setCropperImageUrl(null);
      setPendingExifDate(null);
    }
  }, [plantId, pendingExifDate, cropperImageUrl, router]);

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
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-5 w-5 text-primary" />
                Photo Memories
              </CardTitle>
              <CardDescription>
                {photos.length === 0
                  ? "Capture moments with your plant"
                  : `${photos.length} snapshot${photos.length !== 1 ? "s" : ""} in the collection`}
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-1.5"
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
        <CardContent className="p-6">
          {uploadError && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex items-center justify-between">
              <span>{uploadError}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={() => setUploadError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {photos.length > 0 ? (
            <div className="space-y-8">
              {/* Featured Polaroid */}
              {activePhoto && (
                <div className="flex justify-center">
                  <div className="max-w-md w-full">
                    <PolaroidPhoto
                      photo={activePhoto}
                      plantName={plantName}
                      rotation={0}
                      isActive={true}
                      isFeatured={true}
                      onSetActive={() => {}}
                      onEdit={() => handleEditClick(activePhoto)}
                      onDelete={() => handleDeleteClick(activePhoto)}
                      isPending={isPending}
                    />
                  </div>
                </div>
              )}

              {/* Other Photos - Scattered Polaroids */}
              {otherPhotos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-6 text-center">
                    More memories ({otherPhotos.length})
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
                    {otherPhotos.map((photo, index) => (
                      <div 
                        key={photo.id} 
                        className="w-32 sm:w-40"
                        style={{ 
                          marginTop: index % 2 === 0 ? '0' : '1rem',
                        }}
                      >
                        <PolaroidPhoto
                          photo={photo}
                          plantName={plantName}
                          rotation={photoRotations[photo.id] || 0}
                          isActive={photo.id === activePhotoId}
                          onSetActive={() => handleSetActivePhoto(photo.id)}
                          onEdit={() => handleEditClick(photo)}
                          onDelete={() => handleDeleteClick(photo)}
                          isPending={isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              {/* Empty state styled like a blank polaroid */}
              <div className="mx-auto max-w-xs">
                <div className="bg-amber-50 dark:bg-amber-100/90 p-3 pb-14 shadow-lg rounded-sm rotate-2 hover:rotate-0 transition-transform">
                  <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-200 dark:to-stone-300 flex items-center justify-center">
                    <ImagePlus className="h-16 w-16 text-stone-400" />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 px-4">
                    <p className="font-handwritten text-xl text-stone-600 dark:text-stone-700">
                      Your first photo here!
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-6">
                Start documenting {plantName}&apos;s growth journey with your first snapshot
              </p>
              <Button
                className="mt-4 gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4" />
                Take the first photo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!photoToDelete} onOpenChange={() => setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This photo will be permanently removed from {plantName}&apos;s collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {photoToDelete && (
            <div className="flex justify-center my-4">
              <div className="bg-amber-50 dark:bg-amber-100/90 p-2 pb-10 shadow-lg rounded-sm rotate-2">
                <div className="relative w-32 aspect-square overflow-hidden bg-stone-200">
                  <Image
                    src={photoToDelete.url}
                    alt="Photo to delete"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <p className="absolute bottom-2 left-2 right-2 font-handwritten text-sm text-stone-600 dark:text-stone-700 truncate">
                  {formatPolaroidDate(photoToDelete.taken_at)}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep photo</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete photo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit photo dialog */}
      <Dialog open={!!photoToEdit} onOpenChange={(open) => !open && handleEditClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Edit photo details
            </DialogTitle>
            <DialogDescription>
              Update the date and add a caption for this memory.
            </DialogDescription>
          </DialogHeader>

          {photoToEdit && (
            <div className="space-y-4">
              {/* Photo preview as polaroid */}
              <div className="flex justify-center">
                <div className="relative bg-amber-50 dark:bg-amber-100/90 p-2 pb-10 shadow-lg rounded-sm">
                  <div className="relative w-48 aspect-square overflow-hidden bg-stone-200">
                    <Image
                      src={photoToEdit.url}
                      alt={photoToEdit.caption || `${plantName} photo`}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="font-handwritten text-base text-stone-600 dark:text-stone-700">
                      {editTakenAt ? formatPolaroidDate(new Date(editTakenAt).toISOString()) : "Date..."}
                    </p>
                    {editCaption && (
                      <p className="font-handwritten text-sm text-stone-500 dark:text-stone-600 truncate">
                        {editCaption}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Date/time input */}
              <div className="space-y-2">
                <Label htmlFor="edit-taken-at">When was this taken?</Label>
                <Input
                  id="edit-taken-at"
                  type="datetime-local"
                  value={editTakenAt}
                  onChange={(e) => setEditTakenAt(e.target.value)}
                />
              </div>

              {/* Caption input */}
              <div className="space-y-2">
                <Label htmlFor="edit-caption">Caption (shown on polaroid)</Label>
                <Textarea
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Write something memorable..."
                  rows={2}
                  className="font-handwritten text-lg"
                />
              </div>

              {editError && (
                <p className="text-sm text-destructive">{editError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleEditClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image cropper dialog */}
      {cropperImageUrl && (
        <ImageCropper
          imageUrl={cropperImageUrl}
          open={showCropper}
          onOpenChange={(open) => {
            setShowCropper(open);
            if (!open) {
              URL.revokeObjectURL(cropperImageUrl);
              setCropperImageUrl(null);
              setPendingExifDate(null);
            }
          }}
          onCropComplete={handleCropComplete}
          title="Crop your plant photo"
          description="Create a square photo for your plant's memory collection"
        />
      )}

      {/* Uploading overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading photo...</p>
          </div>
        </div>
      )}
    </>
  );
}
