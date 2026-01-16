"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function removeFromWishlist(wishlistItemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", wishlistItemId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/wishlist");
  return { success: true };
}

export async function convertWishlistToPlant(
  wishlistItemId: string, 
  plantTypeId: string | null, 
  plantName: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Create the plant
  const { data: plant, error: plantError } = await supabase
    .from("plants")
    .insert({
      user_id: user.id,
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
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error removing wishlist item:", deleteError);
    // Plant was created, so we consider this a partial success
  }

  revalidatePath("/plants");
  revalidatePath("/wishlist");
  revalidatePath("/today");
  if (plantTypeId) {
    revalidatePath(`/plant-types/${plantTypeId}`);
  }

  return { success: true, plantId: plant.id };
}
