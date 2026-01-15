import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Droplets, Sun, Ruler, Sparkles, Leaf, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WishlistButton } from "./wishlist-button";
import { AddPlantButton } from "./add-plant-button";

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

export default async function PlantTypeDetailPage({
  params,
}: {
  params: Promise<{ plantTypeId: string }>;
}) {
  const { plantTypeId } = await params;
  const supabase = await createClient();

  // Fetch plant type
  const { data: plantType, error } = await supabase
    .from("plant_types")
    .select("*")
    .eq("id", plantTypeId)
    .single();

  if (error || !plantType) {
    notFound();
  }

  // Check if user has this in their wishlist
  const { data: { user } } = await supabase.auth.getUser();
  const { data: wishlistItem } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user!.id)
    .eq("plant_type_id", plantTypeId)
    .single();

  const isInWishlist = !!wishlistItem;

  // Check if user already has this plant type
  const { data: existingPlants } = await supabase
    .from("plants")
    .select("id, name")
    .eq("user_id", user!.id)
    .eq("plant_type_id", plantTypeId)
    .eq("is_active", true);

  const userOwnsThisType = existingPlants && existingPlants.length > 0;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" render={<Link href="/plant-types" />}>
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </Button>

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
        <div className="flex gap-2">
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
            <Button variant="outline" size="sm" className="ml-auto" render={<Link href="/plants" />}>
              View plants
            </Button>
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
        {/* Light */}
        {plantType.light_requirement && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="h-5 w-5 text-amber-500" />
                Light
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {lightLabels[plantType.light_requirement] || plantType.light_requirement}
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
        {plantType.size_category && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ruler className="h-5 w-5 text-purple-500" />
                Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {sizeLabels[plantType.size_category] || plantType.size_category}
              </p>
              <p className="text-sm text-muted-foreground">
                {sizeDescriptions[plantType.size_category] || ""}
              </p>
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
