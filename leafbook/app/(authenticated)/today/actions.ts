"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";

export async function logCareEvent(
  plantId: string, 
  eventType: "watered" | "fertilized" | "repotted",
  eventDate?: string // ISO date string for backdating
) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Verify the plant belongs to this user
  const { data: plant, error: plantError } = await supabase
    .from("plants")
    .select("id")
    .eq("id", plantId)
    .eq("user_id", userId)
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
      user_id: userId,
      event_type: eventType,
      event_date: dateToUse,
    });

  if (error) {
    console.error("Error logging care event:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/plants");
  revalidatePath(`/plants/${plantId}`);
  
  return { success: true };
}

export async function getProfileForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  return { data, error };
}

export async function getDueTasksForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_plant_due_tasks")
    .select("*")
    .eq("user_id", userId);

  return { data, error };
}

export async function getPlantCountForUser(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("plants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  return { count, error };
}

export async function getWishlistCountForUser(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("wishlist_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return { count, error };
}

export async function getRecentJournalEntriesForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select(`
      id,
      title,
      content,
      entry_date,
      plant_id,
      plants!inner (name)
    `)
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(3);

  return { data, error };
}

export async function getPlantsForSpotlight(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plants")
    .select(`
      id,
      name,
      nickname,
      description,
      how_acquired,
      active_photo_id,
      plant_types (name),
      plant_photos (url)
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(10);

  return { data, error };
}

export async function getActiveIssueCountForUser(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("plant_issues")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  return { count, error };
}

export async function getScheduleSuggestionsForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watering_schedule_suggestions")
    .select(`
      id,
      plant_id,
      suggested_interval_days,
      current_interval_days,
      confidence_score,
      plants!inner (name)
    `)
    .eq("user_id", userId)
    .is("dismissed_at", null)
    .is("accepted_at", null)
    .order("detected_at", { ascending: false })
    .limit(5);

  return { data, error };
}
