import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PlantPhotoGallery } from "./plant-photo-gallery";
import { ArrowLeft, Droplets, Sun, Ruler, Sparkles, Leaf, Home, TreePine, Combine, MapPin, Pencil } from "lucide-react";
import { getCurrentUserId } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WishlistButton } from "./wishlist-button";
import { AddPlantButton } from "./add-plant-button";
import { getCountryName } from "@/lib/origin-mapping";
import {
  getPlantTypeById,
  getPlantTypePhotos,
  getWishlistItemForPlantType,
  getUserPlantsOfType,
} from "@/lib/queries/plant-types";

export const metadata = {
  title: "Plant Type | Leafbook",
  description: "Plant type details and care overview",
};

// Human-friendly labels for enums
const lightLabels: Record<string, string> = {
  dark: "Dark",
  low_indirect: "Low Indirect",
  medium_indirect: "Medium Indirect",
  bright_indirect: "Bright Indirect",
  direct: "Direct",
};

const sizeLabels: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra Large",
};

const sizeDescriptions: Record<string, string> = {
  small: "Compact, perfect for desks and shelves",
  medium: "Great for tabletops and floor",
  large: "Statement piece, floor plant",
  extra_large: "Major presence, needs space",
};

const locationLabels: Record<string, { label: string; description: string }> = {
  indoor: { label: "Indoor", description: "Best kept inside" },
  outdoor: { label: "Outdoor", description: "Thrives outside" },
  both: { label: "Indoor or Outdoor", description: "Versatile placement" },
};

// Helper to format a range display
function formatRange(min: string | null, max: string | null, labels: Record<string, string>): string | null {
  if (!min && !max) return null;
  const minLabel = min ? labels[min] || min : null;
  const maxLabel = max ? labels[max] || max : null;
  
  if (minLabel && maxLabel) {
    return minLabel === maxLabel ? minLabel : `${minLabel} to ${maxLabel}`;
  }
  return minLabel || maxLabel;
}

export default async function PlantTypeDetailPage({
  params,
}: {
  params: Promise<{ plantTypeId: string }>;
}) {
  const { plantTypeId } = await params;

  // Check auth first
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  const supabase = await createClient();

  // Fetch all data in parallel using cached helpers
  const [
    { data: plantType, error },
    { data: photos },
    { data: wishlistItem },
    { data: existingPlants },
    { data: profile },
  ] = await Promise.all([
    getPlantTypeById(plantTypeId),
    getPlantTypePhotos(plantTypeId),
    getWishlistItemForPlantType(userId, plantTypeId),
    getUserPlantsOfType(userId, plantTypeId),
    supabase.from("profiles").select("role").eq("id", userId).single(),
  ]);

  if (error || !plantType) {
    notFound();
  }

  const isInWishlist = !!wishlistItem;
  const userOwnsThisType = existingPlants && existingPlants.length > 0;
  const isAdmin = profile?.role === "admin";
  const origins: Array<{ country_code: string; region: string | null }> = Array.isArray(
    plantType.plant_type_origins
  )
    ? plantType.plant_type_origins
    : [];
  const originRegions = Array.from(
    new Set(origins.map((origin) => origin.region).filter((region): region is string => Boolean(region)))
  );
  const originCountries = Array.from(
    new Set(origins.map((origin) => getCountryName(origin.country_code)))
  ).sort((a: string, b: string) => a.localeCompare(b));

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link href="/plant-types">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {plantType.name}
          </h1>
          {plantType.scientific_name && (
            <p className="mt-1 text-lg italic text-muted-foreground">
              {plantType.scientific_name}
            </p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link href={`/admin/plant-types/${plantTypeId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          <WishlistButton
            plantTypeId={plantTypeId}
            isInWishlist={isInWishlist}
            wishlistItemId={wishlistItem?.id}
          />
          <AddPlantButton 
            plantTypeId={plantTypeId}
            plantTypeName={plantType.name}
          />
        </div>
      </div>

      {/* Photo gallery */}
      {photos && photos.length > 0 && (
        <PlantPhotoGallery photos={photos} plantName={plantType.name} />
      )}

      {/* Already owned notice */}
      {userOwnsThisType && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-primary">You own this plant!</p>
              <p className="text-sm text-muted-foreground">
                You have {existingPlants.length} {plantType.name}{existingPlants.length > 1 ? "s" : ""} in your collection.
              </p>
            </div>
            <Link href="/plants">
              <Button variant="outline" size="sm" className="ml-auto">
                View plants
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {plantType.description && (
        <div>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {plantType.description}
          </p>
        </div>
      )}

      {/* Care recommendations */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Location */}
        {plantType.location_preference && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {plantType.location_preference === "indoor" ? (
                  <Home className="h-5 w-5 text-teal-500" />
                ) : plantType.location_preference === "outdoor" ? (
                  <TreePine className="h-5 w-5 text-teal-500" />
                ) : (
                  <Combine className="h-5 w-5 text-teal-500" />
                )}
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {locationLabels[plantType.location_preference]?.label || plantType.location_preference}
              </p>
              <p className="text-sm text-muted-foreground">
                {locationLabels[plantType.location_preference]?.description || ""}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Native range */}
        {originCountries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-emerald-500" />
                Native range
              </CardTitle>
            </CardHeader>
            <CardContent>
              {originRegions.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {originRegions.length > 1 ? "Regions:" : "Region:"} {originRegions.join(", ")}
                </p>
              )}
              <p className="font-medium">
                {originCountries.length > 1 ? "Countries:" : "Country:"} {originCountries.join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">Where this plant originates naturally</p>
            </CardContent>
          </Card>
        )}

        {/* Light */}
        {(plantType.light_min || plantType.light_max) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="h-5 w-5 text-amber-500" />
                Light
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {formatRange(plantType.light_min, plantType.light_max, lightLabels)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Watering */}
        {plantType.watering_frequency_days && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Droplets className="h-5 w-5 text-blue-500" />
                Watering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                Every {plantType.watering_frequency_days} days
              </p>
              <p className="text-sm text-muted-foreground">
                {plantType.watering_frequency_days <= 5 
                  ? "Likes consistent moisture" 
                  : plantType.watering_frequency_days <= 10 
                    ? "Moderate water needs"
                    : "Drought tolerant"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Fertilizing */}
        {plantType.fertilizing_frequency_days && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-green-500" />
                Fertilizing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                Every {plantType.fertilizing_frequency_days} days
              </p>
              <p className="text-sm text-muted-foreground">
                {plantType.fertilizing_frequency_days <= 14 
                  ? "Heavy feeder" 
                  : plantType.fertilizing_frequency_days <= 30 
                    ? "Regular feeding"
                    : "Light feeder"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Size */}
        {(plantType.size_min || plantType.size_max) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ruler className="h-5 w-5 text-purple-500" />
                Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {formatRange(plantType.size_min, plantType.size_max, sizeLabels)}
              </p>
              {plantType.size_min && plantType.size_max && plantType.size_min === plantType.size_max && (
                <p className="text-sm text-muted-foreground">
                  {sizeDescriptions[plantType.size_min] || ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Care notes */}
      {plantType.care_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Care Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-muted-foreground">
              {plantType.care_notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
