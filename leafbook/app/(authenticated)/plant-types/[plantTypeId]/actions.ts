"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";

export async function addToWishlist(plantTypeId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", userId)
    .eq("plant_type_id", plantTypeId)
    .single();

  if (existing) {
    return { success: true, alreadyExists: true };
  }

  const { error } = await supabase
    .from("wishlist_items")
    .insert({
      user_id: userId,
      plant_type_id: plantTypeId,
    });

  if (error) {
    console.error("Error adding to wishlist:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plant-types/${plantTypeId}`);
  revalidatePath("/wishlist");
  return { success: true };
}

export async function removeFromWishlist(wishlistItemId: string, plantTypeId: string) {
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

  revalidatePath(`/plant-types/${plantTypeId}`);
  revalidatePath("/wishlist");
  return { success: true };
}

export async function addPlant(formData: FormData) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const plantTypeId = formData.get("plantTypeId") as string | null;
  const name = formData.get("name") as string;
  const plantLocation = (formData.get("plant_location") as "indoor" | "outdoor") || "indoor";

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const { data: plant, error } = await supabase
    .from("plants")
    .insert({
      user_id: userId,
      plant_type_id: plantTypeId || null,
      name: name.trim(),
      plant_location: plantLocation,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding plant:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/plants");
  revalidatePath("/");
  if (plantTypeId) {
    revalidatePath(`/plant-types/${plantTypeId}`);
  }

  return { success: true, plantId: plant.id };
}

export async function convertWishlistToPlant(wishlistItemId: string, plantTypeId: string, plantTypeName: string) {
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
      name: plantTypeName,
      plant_location: "indoor",
    })
    .select()
    .single();

  if (plantError) {
    console.error("Error creating plant:", plantError);
    return { success: false, error: plantError.message };
  }

  // Remove from wishlist
  await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", wishlistItemId)
    .eq("user_id", userId);

  revalidatePath("/plants");
  revalidatePath("/wishlist");
  revalidatePath("/");
  revalidatePath(`/plant-types/${plantTypeId}`);

  return { success: true, plantId: plant.id };
}
