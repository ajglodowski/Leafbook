"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logCareEvent(
  plantId: string, 
  eventType: "watered" | "fertilized" | "repotted",
  eventDate?: string // ISO date string for backdating
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verify the plant belongs to this user
  const { data: plant, error: plantError } = await supabase
    .from("plants")
    .select("id")
    .eq("id", plantId)
    .eq("user_id", user.id)
    .single();

  if (plantError || !plant) {
    return { success: false, error: "Plant not found" };
  }

  // Use provided date or default to now
  const dateToUse = eventDate ? new Date(eventDate).toISOString() : new Date().toISOString();

  const { error } = await supabase
    .from("plant_events")
    .insert({
      plant_id: plantId,
      user_id: user.id,
      event_type: eventType,
      event_date: dateToUse,
    });

  if (error) {
    console.error("Error logging care event:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/today");
  revalidatePath("/plants");
  revalidatePath(`/plants/${plantId}`);
  
  return { success: true };
}

export async function updatePlant(
  plantId: string,
  data: {
    name?: string;
    nickname?: string | null;
    is_indoor?: boolean;
    location?: string | null;
    light_exposure?: string | null;
    how_acquired?: string | null;
    description?: string | null;
    acquired_at?: string | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verify the plant belongs to this user
  const { data: plant, error: plantError } = await supabase
    .from("plants")
    .select("id")
    .eq("id", plantId)
    .eq("user_id", user.id)
    .single();

  if (plantError || !plant) {
    return { success: false, error: "Plant not found" };
  }

  const { error } = await supabase
    .from("plants")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", plantId);

  if (error) {
    console.error("Error updating plant:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/plants");
  revalidatePath(`/plants/${plantId}`);
  
  return { success: true };
}

export async function deletePlant(plantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from("plants")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", plantId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting plant:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/plants");
  revalidatePath("/today");
  
  return { success: true };
}

export async function upsertPlantCarePreferences(
  plantId: string,
  data: {
    watering_frequency_days: number | null;
    fertilizing_frequency_days: number | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verify the plant belongs to this user
  const { data: plant, error: plantError } = await supabase
    .from("plants")
    .select("id")
    .eq("id", plantId)
    .eq("user_id", user.id)
    .single();

  if (plantError || !plant) {
    return { success: false, error: "Plant not found" };
  }

  // If both values are null, delete the preferences row (if it exists)
  if (data.watering_frequency_days === null && data.fertilizing_frequency_days === null) {
    const { error } = await supabase
      .from("plant_care_preferences")
      .delete()
      .eq("plant_id", plantId);

    if (error) {
      console.error("Error clearing care preferences:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Upsert the preferences
    const { error } = await supabase
      .from("plant_care_preferences")
      .upsert(
        {
          plant_id: plantId,
          watering_frequency_days: data.watering_frequency_days,
          fertilizing_frequency_days: data.fertilizing_frequency_days,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "plant_id" }
      );

    if (error) {
      console.error("Error updating care preferences:", error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/today");
  revalidatePath("/plants");
  revalidatePath(`/plants/${plantId}`);

  return { success: true };
}
