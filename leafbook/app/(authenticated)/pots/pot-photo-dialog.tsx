"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageCropper } from "@/components/ui/image-cropper";
import { setPotPhoto } from "./actions";

interface Pot {
  id: string;
  name: string;
  photo_url: string | null;
}

interface PotPhotoDialogProps {
  pot: Pot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PotPhotoDialog({ pot, open, onOpenChange }: PotPhotoDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageUrl, setCropperImageUrl] = useState<string | null>(null);

  const isLoading = isUploading || isPending;
  const currentPhotoUrl = previewUrl || pot.photo_url;

  function resetState() {
    setPreviewUrl(null);
    setError(null);
    setCropperImageUrl(null);
    setShowCropper(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    setError(null);

    try {
      // Create a URL for the cropper
      const imageUrl = URL.createObjectURL(file);
      setCropperImageUrl(imageUrl);
      setShowCropper(true);
    } catch (err) {
      console.error("Error preparing image:", err);
      setError(err instanceof Error ? err.message : "Failed to prepare image");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      // Create preview from the cropped image
      const objectUrl = URL.createObjectURL(croppedBlob);
      setPreviewUrl(objectUrl);

      const photoId = crypto.randomUUID();
      const filename = `${photoId}.jpg`;

      // Create a File from the Blob for upload
      const croppedFile = new File([croppedBlob], filename, { type: "image/jpeg" });

      // Upload to Vercel Blob
      const blob = await upload(filename, croppedFile, {
        access: "public",
        handleUploadUrl: "/api/blob/pot-photos",
        clientPayload: JSON.stringify({ potId: pot.id }),
      });

      // Update database with new photo URL
      startTransition(async () => {
        const result = await setPotPhoto(pot.id, blob.url);
        if (!result.success) {
          setError(result.error || "Failed to save photo");
          setPreviewUrl(null);
        } else {
          onOpenChange(false);
          resetState();
        }
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload photo");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Clean up cropper URL
      if (cropperImageUrl) {
        URL.revokeObjectURL(cropperImageUrl);
      }
      setCropperImageUrl(null);
    }
  }, [pot.id, cropperImageUrl, onOpenChange]);

  function handleRemovePhoto() {
    startTransition(async () => {
      const result = await setPotPhoto(pot.id, null);
      if (result.success) {
        onOpenChange(false);
        resetState();
      } else {
        setError(result.error || "Failed to remove photo");
      }
    });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          onOpenChange(newOpen);
          if (!newOpen) resetState();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {pot.photo_url ? "Change photo" : "Add photo"}
            </DialogTitle>
            <DialogDescription>
              Add a photo of "{pot.name}" to make it easier to identify.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current/Preview photo */}
            {currentPhotoUrl ? (
              <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={currentPhotoUrl}
                  alt={pot.name}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto flex aspect-square w-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
                <ImagePlus className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}

            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />

            {error && <p className="text-sm text-center text-destructive">{error}</p>}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" />
                  {pot.photo_url ? "Choose new photo" : "Choose photo"}
                </>
              )}
            </Button>

            {pot.photo_url && (
              <Button
                variant="outline"
                onClick={handleRemovePhoto}
                disabled={isLoading}
                className="w-full text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Remove photo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image cropper dialog */}
      {cropperImageUrl && (
        <ImageCropper
          imageUrl={cropperImageUrl}
          open={showCropper}
          onOpenChange={(newOpen) => {
            setShowCropper(newOpen);
            if (!newOpen) {
              URL.revokeObjectURL(cropperImageUrl);
              setCropperImageUrl(null);
            }
          }}
          onCropComplete={handleCropComplete}
          title="Crop pot photo"
          description="Create a square photo for your pot"
        />
      )}
    </>
  );
}
