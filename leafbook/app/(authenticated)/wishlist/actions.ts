"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";
import {
  plantMutationTags,
  recordTag,
  userTag,
  wishlistMutationTags,
} from "@/lib/cache-tags";

export async function removeFromWishlist(wishlistItemId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", wishlistItemId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return { success: false, error: error.message };
  }

  wishlistMutationTags(userId, wishlistItemId).forEach((tag) => updateTag(tag));
  return { success: true };
}

export async function convertWishlistToPlant(
  wishlistItemId: string, 
  plantTypeId: string | null, 
  plantName: string
) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Create the plant
  const { data: plant, error: plantError } = await supabase
    .from("plants")
    .insert({
      user_id: userId,
      plant_type_id: plantTypeId,
      name: plantName,
      plant_location: "indoor",
    })
    .select()
    .single();

  if (plantError) {
    console.error("Error creating plant:", plantError);
    return { success: false, error: plantError.message };
  }

  // Remove from wishlist
  const { error: deleteError } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", wishlistItemId)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Error removing wishlist item:", deleteError);
    // Plant was created, so we consider this a partial success
  }

  plantMutationTags(userId, plant.id).forEach((tag) => updateTag(tag));
  wishlistMutationTags(userId, wishlistItemId, plantTypeId).forEach((tag) => updateTag(tag));
  if (plantTypeId) {
    updateTag(recordTag("plant-type", plantTypeId));
  }

  return { success: true, plantId: plant.id };
}
