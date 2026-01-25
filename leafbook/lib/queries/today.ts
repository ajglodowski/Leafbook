import { cacheTag } from "next/cache";

import { profileTags, userTag } from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Get profile for a user.
 */
export async function getProfileForUser(userId: string) {
  "use cache";
  cacheTag(...profileTags(userId));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  return { data, error };
}

/**
 * Get due tasks for a user (Today dashboard).
 */
export async function getDueTasksForUser(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "due-tasks"));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("v_plant_due_tasks")
    .select("*")
    .eq("user_id", userId);

  return { data, error };
}

/**
 * Get plant count for a user.
 */
export async function getPlantCountForUser(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("plants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  return { count, error };
}

/**
 * Get wishlist count for a user.
 */
export async function getWishlistCountForUser(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "wishlist"));

  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("wishlist_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return { count, error };
}

/**
 * Get recent journal entries for a user.
 */
export async function getRecentJournalEntriesForUser(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "journal"));

  const supabase = createPublicClient();
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

/**
 * Get plants for spotlight section.
 */
export async function getPlantsForSpotlight(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();
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

/**
 * Get active issue count for a user.
 */
export async function getActiveIssueCountForUser(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "issues"));

  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("plant_issues")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  return { count, error };
}

/**
 * Get schedule suggestions for a user.
 */
export async function getScheduleSuggestionsForUser(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "schedule-suggestions"));

  const supabase = createPublicClient();
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
