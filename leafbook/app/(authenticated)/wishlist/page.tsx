import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Leaf, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WishlistItemActions } from "./wishlist-item-actions";
import { getWishlistItemsForUserById } from "@/lib/queries/wishlist";
import { getCurrentUserId } from "@/lib/supabase/server";

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistItems.map((item) => {
            const plantType = Array.isArray(item.plant_types) ? item.plant_types[0] : item.plant_types;
            const name = plantType?.name || item.custom_name || "Unknown plant";
            
            return (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">
                    {plantType ? (
                      <Link 
                        href={`/plant-types/${plantType.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {name}
                      </Link>
                    ) : (
                      name
                    )}
                  </CardTitle>
                  {plantType?.scientific_name && (
                    <CardDescription className="italic">
                      {plantType.scientific_name}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1">
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

                <CardFooter className="flex gap-2">
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
