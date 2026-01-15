"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

  const { data, error } = await supabase
    .from("plant_types")
    .insert({
      name: name.trim(),
      scientific_name: scientific_name?.trim() || null,
      description: description?.trim() || null,
      light_requirement: light_requirement || null,
      watering_frequency_days: watering_frequency_days ? parseInt(watering_frequency_days) : null,
      fertilizing_frequency_days: fertilizing_frequency_days ? parseInt(fertilizing_frequency_days) : null,
      size_category: size_category || null,
      care_notes: care_notes?.trim() || null,
    })
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
