import { cacheTag } from "next/cache";

import { scopedListTag, userTag } from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/server";

export interface JournalEntryWithPlant {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  created_at: string;
  event_id: string | null;
  plant_id: string;
  plant: {
    id: string;
    name: string;
    plant_type_id: string | null;
    plant_types: {
      id: string;
      name: string;
    } | null;
  };
}


export interface PlantIssueWithPlant {
  id: string;
  issue_type: string;
  severity: string;
  status: string;
  description: string | null;
  started_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  plant_id: string;
  plant: {
    id: string;
    name: string;
    plant_type_id: string | null;
    plant_types: {
      id: string;
      name: string;
    } | null;
  };
}

export async function getJournalEntriesForUser(
  userId: string,
  options?: {
    plantId?: string;
    limit?: number;
  }
): Promise<{ entries: JournalEntryWithPlant[]; error: string | null }> {
  "use cache";
  // Tag based on scope
  cacheTag(userTag(userId, "journal"));
  if (options?.plantId) {
    cacheTag(scopedListTag("journal-entries", options.plantId));
  }

  const supabase = createPublicClient();

  let query = supabase
    .from("journal_entries")
    .select(`
      id,
      title,
      content,
      entry_date,
      created_at,
      event_id,
      plant_id,
      plants!inner (
        id,
        name,
        plant_type_id,
        plant_types (
          id,
          name
        )
      )
    `)
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });

  if (options?.plantId) {
    query = query.eq("plant_id", options.plantId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching journal entries:", error);
    return { entries: [], error: error.message };
  }

  // Transform the data to match our interface
  const entries: JournalEntryWithPlant[] = (data || []).map((entry) => {
    const plant = Array.isArray(entry.plants) ? entry.plants[0] : entry.plants;
    const plantType = plant?.plant_types
      ? (Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types)
      : null;

    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      entry_date: entry.entry_date,
      created_at: entry.created_at,
      event_id: entry.event_id ?? null,
      plant_id: entry.plant_id,
      plant: {
        id: plant?.id || entry.plant_id,
        name: plant?.name || "Unknown Plant",
        plant_type_id: plant?.plant_type_id || null,
        plant_types: plantType ? { id: plantType.id, name: plantType.name } : null,
      },
    };
  });

  return { entries, error: null };
}

export async function getUserPlantsForJournal(userId: string): Promise<{
  plants: { id: string; name: string }[];
  error: string | null;
}> {
  "use cache";
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plants")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching user plants:", error);
    return { plants: [], error: error.message };
  }

  return { plants: data || [], error: null };
}

export async function getPlantIssuesForUser(
  userId: string,
  options?: {
    plantId?: string;
    status?: "active" | "resolved" | "monitoring" | "all";
    limit?: number;
  }
): Promise<{ issues: PlantIssueWithPlant[]; error: string | null }> {
  "use cache";
  // Tag based on scope
  cacheTag(userTag(userId, "issues"));
  if (options?.plantId) {
    cacheTag(scopedListTag("plant-issues", options.plantId));
  }

  const supabase = createPublicClient();

  let query = supabase
    .from("plant_issues")
    .select(`
      id,
      issue_type,
      severity,
      status,
      description,
      started_at,
      resolved_at,
      resolution_notes,
      created_at,
      plant_id,
      plants!inner (
        id,
        name,
        plant_type_id,
        plant_types (
          id,
          name
        )
      )
    `)
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (options?.plantId) {
    query = query.eq("plant_id", options.plantId);
  }

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching plant issues:", error);
    return { issues: [], error: error.message };
  }

  // Transform the data to match our interface
  const issues: PlantIssueWithPlant[] = (data || []).map((issue) => {
    const plant = Array.isArray(issue.plants) ? issue.plants[0] : issue.plants;
    const plantType = plant?.plant_types
      ? (Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types)
      : null;

    return {
      id: issue.id,
      issue_type: issue.issue_type,
      severity: issue.severity,
      status: issue.status,
      description: issue.description,
      started_at: issue.started_at,
      resolved_at: issue.resolved_at,
      resolution_notes: issue.resolution_notes,
      created_at: issue.created_at,
      plant_id: issue.plant_id,
      plant: {
        id: plant?.id || issue.plant_id,
        name: plant?.name || "Unknown Plant",
        plant_type_id: plant?.plant_type_id || null,
        plant_types: plantType ? { id: plantType.id, name: plantType.name } : null,
      },
    };
  });

  return { issues, error: null };
}
