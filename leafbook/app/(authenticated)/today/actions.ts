"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { careEventMutationTags } from "@/lib/cache-tags";
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

  // Invalidate cache tags for the affected plant and user's due tasks
  // userId is guaranteed to be string after the redirect guard above
  careEventMutationTags(userId as string, plantId).forEach((tag) => updateTag(tag));
  
  return { success: true };
}
