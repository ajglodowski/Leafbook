"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";

// Helper to verify admin role
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return { supabase, user };
}

export async function createPlantType(formData: FormData) {
  const { supabase, user } = await verifyAdmin();

  const name = formData.get("name") as string;
  const scientific_name = formData.get("scientific_name") as string | null;
  const description = formData.get("description") as string | null;
  const light_requirement = formData.get("light_requirement") as string | null;
  const watering_frequency_days = formData.get("watering_frequency_days") as string | null;
  const fertilizing_frequency_days = formData.get("fertilizing_frequency_days") as string | null;
  const size_category = formData.get("size_category") as string | null;
  const care_notes = formData.get("care_notes") as string | null;
  
  // Optional Wikidata fields (from "Create from Wikidata" flow)
  const wikidata_qid = formData.get("wikidata_qid") as string | null;
  const wikipedia_title = formData.get("wikipedia_title") as string | null;

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const insertData: Record<string, unknown> = {
    name: name.trim(),
    scientific_name: scientific_name?.trim() || null,
    description: description?.trim() || null,
    light_requirement: light_requirement || null,
    watering_frequency_days: watering_frequency_days ? parseInt(watering_frequency_days) : null,
    fertilizing_frequency_days: fertilizing_frequency_days ? parseInt(fertilizing_frequency_days) : null,
    size_category: size_category || null,
    care_notes: care_notes?.trim() || null,
  };

  // Include Wikidata fields if provided
  if (wikidata_qid) {
    insertData.wikidata_qid = wikidata_qid;
    insertData.wikipedia_title = wikipedia_title || null;
    insertData.wikipedia_lang = "en";
    insertData.enriched_at = new Date().toISOString();
    insertData.enriched_by = user.id;
  }

  const { data, error } = await supabase
    .from("plant_types")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating plant type:", error);
    if (error.code === "23505") {
      return { success: false, error: "A plant type with this name already exists" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/plant-types");
  revalidatePath("/plant-types");

  return { success: true, plantTypeId: data.id };
}

export async function updatePlantType(id: string, formData: FormData) {
  const { supabase } = await verifyAdmin();

  const name = formData.get("name") as string;
  const scientific_name = formData.get("scientific_name") as string | null;
  const description = formData.get("description") as string | null;
  const light_requirement = formData.get("light_requirement") as string | null;
  const watering_frequency_days = formData.get("watering_frequency_days") as string | null;
  const fertilizing_frequency_days = formData.get("fertilizing_frequency_days") as string | null;
  const size_category = formData.get("size_category") as string | null;
  const care_notes = formData.get("care_notes") as string | null;

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const { error } = await supabase
    .from("plant_types")
    .update({
      name: name.trim(),
      scientific_name: scientific_name?.trim() || null,
      description: description?.trim() || null,
      light_requirement: light_requirement || null,
      watering_frequency_days: watering_frequency_days ? parseInt(watering_frequency_days) : null,
      fertilizing_frequency_days: fertilizing_frequency_days ? parseInt(fertilizing_frequency_days) : null,
      size_category: size_category || null,
      care_notes: care_notes?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating plant type:", error);
    if (error.code === "23505") {
      return { success: false, error: "A plant type with this name already exists" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/plant-types");
  revalidatePath(`/admin/plant-types/${id}`);
  revalidatePath("/plant-types");
  revalidatePath(`/plant-types/${id}`);

  return { success: true };
}

export async function deletePlantType(id: string) {
  const { supabase } = await verifyAdmin();

  // Check if any plants are using this type
  const { count } = await supabase
    .from("plants")
    .select("id", { count: "exact", head: true })
    .eq("plant_type_id", id);

  if (count && count > 0) {
    return { 
      success: false, 
      error: `Cannot delete: ${count} plant${count > 1 ? "s" : ""} are using this type` 
    };
  }

  // Check if any wishlist items reference this type
  const { count: wishlistCount } = await supabase
    .from("wishlist_items")
    .select("id", { count: "exact", head: true })
    .eq("plant_type_id", id);

  if (wishlistCount && wishlistCount > 0) {
    return { 
      success: false, 
      error: `Cannot delete: ${wishlistCount} wishlist item${wishlistCount > 1 ? "s" : ""} reference this type` 
    };
  }

  const { error } = await supabase
    .from("plant_types")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting plant type:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/plant-types");
  revalidatePath("/plant-types");

  return { success: true };
}

// ============================================
// Photo Management Actions
// ============================================

export async function setPlantTypePrimaryPhoto(photoId: string, plantTypeId: string) {
  const { supabase } = await verifyAdmin();

  // First, unset all primary flags for this plant type
  const { error: unsetError } = await supabase
    .from("plant_type_photos")
    .update({ is_primary: false })
    .eq("plant_type_id", plantTypeId);

  if (unsetError) {
    console.error("Error unsetting primary photos:", unsetError);
    return { success: false, error: unsetError.message };
  }

  // Set the new primary photo
  const { error: setError } = await supabase
    .from("plant_type_photos")
    .update({ is_primary: true })
    .eq("id", photoId)
    .eq("plant_type_id", plantTypeId);

  if (setError) {
    console.error("Error setting primary photo:", setError);
    return { success: false, error: setError.message };
  }

  revalidatePath(`/admin/plant-types/${plantTypeId}`);
  revalidatePath(`/plant-types/${plantTypeId}`);
  revalidatePath("/plant-types");

  return { success: true };
}

export async function reorderPlantTypePhotos(plantTypeId: string, orderedPhotoIds: string[]) {
  const { supabase } = await verifyAdmin();

  // Update display_order for each photo
  for (let i = 0; i < orderedPhotoIds.length; i++) {
    const { error } = await supabase
      .from("plant_type_photos")
      .update({ display_order: i })
      .eq("id", orderedPhotoIds[i])
      .eq("plant_type_id", plantTypeId);

    if (error) {
      console.error("Error reordering photos:", error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath(`/admin/plant-types/${plantTypeId}`);
  revalidatePath(`/plant-types/${plantTypeId}`);
  revalidatePath("/plant-types");

  return { success: true };
}

export async function deletePlantTypePhoto(photoId: string) {
  const { supabase } = await verifyAdmin();

  // Fetch the photo to get the URL
  const { data: photo, error: fetchError } = await supabase
    .from("plant_type_photos")
    .select("id, url, plant_type_id, is_primary")
    .eq("id", photoId)
    .single();

  if (fetchError || !photo) {
    return { success: false, error: "Photo not found" };
  }

  const plantTypeId = photo.plant_type_id;
  const wasPrimary = photo.is_primary;

  // Delete from Vercel Blob
  try {
    await del(photo.url);
  } catch (error) {
    console.error("Error deleting from blob storage:", error);
    // Continue to delete from DB even if blob deletion fails
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("plant_type_photos")
    .delete()
    .eq("id", photoId);

  if (deleteError) {
    console.error("Error deleting plant type photo:", deleteError);
    return { success: false, error: deleteError.message };
  }

  // If this was the primary photo, set a new primary
  if (wasPrimary) {
    const { data: remainingPhotos } = await supabase
      .from("plant_type_photos")
      .select("id")
      .eq("plant_type_id", plantTypeId)
      .order("display_order", { ascending: true })
      .limit(1);

    if (remainingPhotos && remainingPhotos.length > 0) {
      await supabase
        .from("plant_type_photos")
        .update({ is_primary: true })
        .eq("id", remainingPhotos[0].id);
    }
  }

  revalidatePath(`/admin/plant-types/${plantTypeId}`);
  revalidatePath(`/plant-types/${plantTypeId}`);
  revalidatePath("/plant-types");

  return { success: true };
}
