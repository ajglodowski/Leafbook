import { Heart, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getWishlistItemsForUserById } from "@/lib/queries/wishlist";
import { getCurrentUserId } from "@/lib/supabase/server";

import { WishlistItemActions } from "./wishlist-item-actions";

export const metadata = {
  title: "Wishlist | Leafbook",
  description: "Keep track of plants you want to add",
};

export default async function WishlistPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/auth/login");
  }
  
  const { data: wishlistItems, error } = await getWishlistItemsForUserById(userId);

  if (error) {
    console.error("Error fetching wishlist:", error);
  }

  const hasItems = wishlistItems && wishlistItems.length > 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Wishlist</h1>
          <p className="mt-1 text-muted-foreground">
            Plants you'd love to add to your collection
          </p>
        </div>
        {hasItems && (
          <Link href="/plant-types">
            <Button variant="outline">
              Browse more
            </Button>
          </Link>
        )}
      </div>

      {/* Wishlist items */}
      {hasItems ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {wishlistItems.map((item) => {
            const plantType = Array.isArray(item.plant_types) ? item.plant_types[0] : item.plant_types;
            const name = plantType?.name || item.custom_name || "Unknown plant";
            const photos = plantType?.plant_type_photos || [];
            const primaryPhoto = photos.find((photo) => photo.is_primary) || photos[0];
            const primaryPhotoUrl = primaryPhoto?.url || null;
            
            return (
              <Card key={item.id} className="relative flex flex-col pt-0 overflow-hidden">
                {plantType && (
                  <Link
                    href={`/plant-types/${plantType.id}`}
                    aria-label={`View ${name}`}
                    className="absolute inset-0 z-0"
                  />
                )}
                <div className="relative z-10 aspect-square w-full pointer-events-none">
                  {primaryPhotoUrl ? (
                    <Image
                      src={primaryPhotoUrl}
                      alt={plantType?.scientific_name ? `${name} (${plantType.scientific_name})` : name}
                      fill
                      className="object-cover rounded-b-2xl"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Leaf className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardHeader className="relative z-10 pointer-events-none">
                  <CardTitle className="font-serif text-lg">
                    {name}
                  </CardTitle>
                  {plantType?.scientific_name && (
                    <CardDescription className="italic">
                      {plantType.scientific_name}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="relative z-10 flex-1 pointer-events-none">
                  {plantType?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {plantType.description}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-sm italic text-muted-foreground">
                      "{item.notes}"
                    </p>
                  )}
                </CardContent>

                <CardFooter className="relative z-10 flex gap-2 pointer-events-auto">
                  <WishlistItemActions
                    wishlistItemId={item.id}
                    plantTypeId={item.plant_type_id}
                    plantTypeName={name}
                  />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Browse the catalog and save plants you'd like to get someday. When you bring one home, convert it to your collection with one tap!"
        >
          <Link href="/plant-types">
            <Button>
              Browse catalog
            </Button>
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
