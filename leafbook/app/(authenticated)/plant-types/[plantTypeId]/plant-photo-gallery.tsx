"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type PlantPhoto = {
  id: string;
  url: string;
  caption: string | null;
  is_primary?: boolean | null;
};

interface PlantPhotoGalleryProps {
  photos: PlantPhoto[];
  plantName: string;
}

export function PlantPhotoGallery({ photos, plantName }: PlantPhotoGalleryProps) {
  const initialPhoto = useMemo(() => photos.find((photo) => photo.is_primary) ?? photos[0], [photos]);
  const [selectedPhoto, setSelectedPhoto] = useState<PlantPhoto>(initialPhoto);

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-center">
      <div className="relative aspect-square my-auto w-full max-w-md overflow-hidden rounded-xl bg-muted sm:mx-auto md:mx-0 md:max-w-lg">
        <Image
          src={selectedPhoto.url}
          alt={selectedPhoto.caption || plantName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 512px"
        />
        {selectedPhoto.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4">
            <p className="text-sm text-white">{selectedPhoto.caption}</p>
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-24 md:flex-col md:overflow-visible lg:w-32">
          {photos.map((photo) => {
            const isSelected = photo.id === selectedPhoto.id;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className={`relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted transition md:h-28 md:w-28 lg:h-32 lg:w-32 ${
                  isSelected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/40"
                }`}
                aria-label={`View photo of ${plantName}`}
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || plantName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 25vw, (max-width: 1024px) 15vw, 96px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
