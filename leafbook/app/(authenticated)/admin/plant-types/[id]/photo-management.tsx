"use client";

import { upload } from "@vercel/blob/client";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Info,
  Loader2,
  Plus,
  Star,
  Trash2,
  X
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageCropper } from "@/components/ui/image-cropper";

import {
  deletePlantTypePhoto,
  reorderPlantTypePhotos,
  setPlantTypePrimaryPhoto
} from "../actions";

interface PlantTypePhoto {
  id: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
  display_order: number;
}

interface WikimediaImage {
  title: string;
  url: string;
  descriptionUrl: string;
  thumbUrl: string | null;
  width: number;
  height: number;
  mime: string;
  license: {
    shortName: string;
    url: string | null;
    attributionRequired: boolean;
  } | null;
  artist: string | null;
  credit: string | null;
}

interface PhotoManagementProps {
  plantTypeId: string;
  plantTypeName: string;
  wikipediaTitle?: string | null;
  photos: PlantTypePhoto[];
}

export function PhotoManagement({ plantTypeId, plantTypeName, wikipediaTitle, photos }: PhotoManagementProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<PlantTypePhoto | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for photos to handle reordering before save
  const [localPhotos, setLocalPhotos] = useState<PlantTypePhoto[]>(photos);
  const [hasReorderChanges, setHasReorderChanges] = useState(false);

  // Wikipedia import state
  const [showWikipediaDialog, setShowWikipediaDialog] = useState(false);
  const [isLoadingWikipedia, setIsLoadingWikipedia] = useState(false);
  const [wikipediaImages, setWikipediaImages] = useState<WikimediaImage[]>([]);
  const [selectedWikipediaImages, setSelectedWikipediaImages] = useState<WikimediaImage[]>([]);
  const [isImportingImage, setIsImportingImage] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [wikipediaError, setWikipediaError] = useState<string | null>(null);

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageUrl, setCropperImageUrl] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    try {
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
      const photoId = crypto.randomUUID();
      const filename = `${photoId}.jpg`;

      // Create a File from the Blob for upload
      const croppedFile = new File([croppedBlob], filename, { type: "image/jpeg" });

      await upload(filename, croppedFile, {
        access: "public",
        handleUploadUrl: "/api/blob/plant-type-photos",
        clientPayload: JSON.stringify({
          plantTypeId,
          caption: null,
        }),
      });

      // Refresh the page to show the new photo
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
    }
  }, [plantTypeId, cropperImageUrl, router]);

  function handleSetPrimary(photo: PlantTypePhoto) {
    startTransition(async () => {
      const result = await setPlantTypePrimaryPhoto(photo.id, plantTypeId);
      if (!result.success) {
        setUploadError(result.error || "Failed to set primary photo");
      }
    });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newPhotos = [...localPhotos];
    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
    setLocalPhotos(newPhotos);
    setHasReorderChanges(true);
  }

  function handleMoveDown(index: number) {
    if (index === localPhotos.length - 1) return;
    const newPhotos = [...localPhotos];
    [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
    setLocalPhotos(newPhotos);
    setHasReorderChanges(true);
  }

  function handleSaveOrder() {
    startTransition(async () => {
      const orderedIds = localPhotos.map((p) => p.id);
      const result = await reorderPlantTypePhotos(plantTypeId, orderedIds);
      if (result.success) {
        setHasReorderChanges(false);
      } else {
        setUploadError(result.error || "Failed to save order");
      }
    });
  }

  function handleCancelReorder() {
    setLocalPhotos(photos);
    setHasReorderChanges(false);
  }

  function handleDeleteClick(photo: PlantTypePhoto) {
    setPhotoToDelete(photo);
  }

  async function handleConfirmDelete() {
    if (!photoToDelete) return;

    startTransition(async () => {
      const result = await deletePlantTypePhoto(photoToDelete.id);
      if (!result.success) {
        setUploadError(result.error || "Failed to delete photo");
      } else {
        // Remove from local state
        setLocalPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
      }
      setPhotoToDelete(null);
    });
  }

  // Sync local photos when props change (e.g., after upload)
  if (photos.length !== localPhotos.length && !hasReorderChanges) {
    setLocalPhotos(photos);
  }

  // Wikipedia import handlers
  async function handleOpenWikipediaDialog() {
    if (!wikipediaTitle) return;

    setShowWikipediaDialog(true);
    setIsLoadingWikipedia(true);
    setWikipediaError(null);
    setWikipediaImages([]);
    setSelectedWikipediaImages([]);

    try {
      // Fetch images from Wikipedia page
      const response = await fetch(
        `/api/admin/wikipedia/images?title=${encodeURIComponent(wikipediaTitle)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch images");
      }

      setWikipediaImages(data.images || []);
      if ((data.images || []).length === 0) {
        setWikipediaError("No importable images found on this Wikipedia page");
      }
    } catch (error) {
      setWikipediaError(error instanceof Error ? error.message : "Failed to fetch images");
    } finally {
      setIsLoadingWikipedia(false);
    }
  }

  function toggleImageSelection(image: WikimediaImage) {
    setSelectedWikipediaImages((prev) => {
      const isSelected = prev.some((img) => img.title === image.title);
      if (isSelected) {
        return prev.filter((img) => img.title !== image.title);
      } else {
        return [...prev, image];
      }
    });
  }

  function selectAllValidImages() {
    const validImages = wikipediaImages.filter((image) => {
      if (!image.license) return false;
      const name = image.license.shortName.toLowerCase();
      return (
        (name.includes("cc") || name.includes("public domain") || name.startsWith("pd")) &&
        !name.includes("nc") &&
        !name.includes("nd")
      );
    });
    setSelectedWikipediaImages(validImages);
  }

  function clearImageSelection() {
    setSelectedWikipediaImages([]);
  }

  async function handleImportWikipediaImages() {
    if (selectedWikipediaImages.length === 0) return;

    setIsImportingImage(true);
    setWikipediaError(null);
    setImportProgress({ current: 0, total: selectedWikipediaImages.length });

    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < selectedWikipediaImages.length; i++) {
      const image = selectedWikipediaImages[i];
      setImportProgress({ current: i + 1, total: selectedWikipediaImages.length });

      try {
        const response = await fetch("/api/admin/wikipedia/import-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plantTypeId,
            fileTitle: image.title,
            setPrimary: localPhotos.length === 0 && successCount === 0,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          errors.push(`${image.title.replace("File:", "")}: ${data.error || "Import failed"}`);
        } else {
          successCount++;
        }
      } catch (error) {
        errors.push(`${image.title.replace("File:", "")}: ${error instanceof Error ? error.message : "Import failed"}`);
      }
    }

    setIsImportingImage(false);

    if (errors.length > 0) {
      setWikipediaError(`Imported ${successCount} of ${selectedWikipediaImages.length} images. Errors:\n${errors.join("\n")}`);
    }

    if (successCount > 0) {
      // Refresh to show new photos
      router.refresh();
      if (errors.length === 0) {
        // Close dialog only if all succeeded
        setShowWikipediaDialog(false);
        setSelectedWikipediaImages([]);
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5" />
                Photos
              </CardTitle>
              <CardDescription>
                {photos.length === 0
                  ? "No photos yet"
                  : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasReorderChanges && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelReorder}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveOrder}
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save order"}
                  </Button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload-admin"
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
              {wikipediaTitle && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenWikipediaDialog}
                  disabled={isUploading || isLoadingWikipedia}
                  className="gap-1"
                >
                  <Globe className="h-4 w-4" />
                  Import from Wikipedia
                </Button>
              )}
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

          {localPhotos.length > 0 ? (
            <div className="space-y-2">
              {localPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-2"
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={photo.url}
                      alt={photo.caption || plantTypeName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {photo.is_primary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Star className="h-3 w-3 fill-current" />
                          Primary
                        </span>
                      )}
                      {photo.caption && (
                        <span className="text-sm text-muted-foreground truncate">
                          {photo.caption}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Order: {index + 1}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Reorder buttons */}
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || isPending}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localPhotos.length - 1 || isPending}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Set primary */}
                    {!photo.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(photo)}
                        disabled={isPending}
                        className="gap-1"
                      >
                        <Star className="h-3 w-3" />
                        Set primary
                      </Button>
                    )}

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteClick(photo)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Camera className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No photos yet</p>
              <p className="text-sm">Add photos to showcase this plant type in the catalog.</p>
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
              This action cannot be undone. The photo will be permanently deleted from the catalog.
              {photoToDelete?.is_primary && (
                <span className="mt-2 block font-medium text-amber-600">
                  This is the primary photo. The next photo will become the new primary.
                </span>
              )}
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
            }
          }}
          onCropComplete={handleCropComplete}
          title="Crop plant type photo"
          description="Create a square photo for the catalog"
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

      {/* Wikipedia image import panel */}
      {showWikipediaDialog && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5" />
                  Import from Wikipedia
                </CardTitle>
                <CardDescription>
                  Select images from the Wikipedia article to import. Only images with compatible licenses (CC0, CC BY, CC BY-SA, Public Domain) can be imported.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowWikipediaDialog(false);
                  setWikipediaImages([]);
                  setSelectedWikipediaImages([]);
                  setWikipediaError(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingWikipedia && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {wikipediaError && !isLoadingWikipedia && (
              <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive whitespace-pre-wrap">
                {wikipediaError}
              </div>
            )}

            {!isLoadingWikipedia && wikipediaImages.length > 0 && (
              <>
                {/* Selection controls */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedWikipediaImages.length} of {wikipediaImages.length} images selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllValidImages}
                      disabled={isImportingImage}
                    >
                      Select all valid
                    </Button>
                    {selectedWikipediaImages.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearImageSelection}
                        disabled={isImportingImage}
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {wikipediaImages.map((image) => {
                    const isSelected = selectedWikipediaImages.some((img) => img.title === image.title);
                    const licenseNameLower = image.license?.shortName.toLowerCase() || "";
                    const hasValidLicense = image.license && (
                      (licenseNameLower.includes("cc") || 
                       licenseNameLower.includes("public domain") || 
                       licenseNameLower.startsWith("pd")) &&
                      !licenseNameLower.includes("nc") &&
                      !licenseNameLower.includes("nd")
                    );

                    return (
                      <button
                        key={image.title}
                        onClick={() => hasValidLicense && toggleImageSelection(image)}
                        disabled={!hasValidLicense || isImportingImage}
                        className={`group relative overflow-hidden rounded-lg border p-2 text-left transition-all ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20"
                            : hasValidLicense
                            ? "hover:border-primary/50"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {/* Image thumbnail */}
                        <div className="relative aspect-square w-full overflow-hidden rounded bg-muted">
                          {image.thumbUrl ? (
                            <Image
                              src={image.thumbUrl}
                              alt={image.title}
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <Check className="h-8 w-8 text-primary" />
                            </div>
                          )}
                        </div>

                        {/* Image info */}
                        <div className="mt-2 space-y-1">
                          <p className="line-clamp-1 text-xs font-medium">
                            {image.title.replace("File:", "")}
                          </p>
                          <div className="flex flex-wrap items-center gap-1">
                            {image.license && (
                              <span className={`rounded px-1.5 py-0.5 text-xs ${
                                hasValidLicense
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                                {image.license.shortName}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {image.width}x{image.height}
                            </span>
                          </div>
                          {image.artist && (
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              By: {image.artist}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Import button */}
                {selectedWikipediaImages.length > 0 && (
                  <div className="mt-4 rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {selectedWikipediaImages.length} image{selectedWikipediaImages.length !== 1 ? "s" : ""} selected
                      </p>
                      {selectedWikipediaImages.some((img) => img.license?.attributionRequired) && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <Info className="h-3 w-3" />
                          Some images require attribution
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleImportWikipediaImages}
                      disabled={isImportingImage}
                      className="w-full gap-2"
                    >
                      {isImportingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing {importProgress.current} of {importProgress.total}...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Import {selectedWikipediaImages.length} image{selectedWikipediaImages.length !== 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
