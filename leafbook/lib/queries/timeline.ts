import { cacheTag } from "next/cache";

import { userTag } from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/server";

export interface TimelinePlantInfo {
  id: string;
  name: string;
  plant_type_id: string | null;
  plant_types: {
    id: string;
    name: string;
  } | null;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  event_date: string;
  notes: string | null;
  metadata: unknown | null;
  plant_id: string;
  plant: TimelinePlantInfo;
}

export interface TimelineIssue {
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
  plant: TimelinePlantInfo;
}

export interface TimelineJournalEntry {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  created_at: string;
  event_id: string | null;
  plant_id: string;
  plant: TimelinePlantInfo;
}

interface TimelineOptions {
  plantId?: string;
  eventType?: string;
  limit?: number;
}

function normalizePlantType(plant: {
  id: string;
  name: string;
  plant_type_id: string | null;
  plant_types: { id: string; name: string }[] | { id: string; name: string } | null;
} | null): TimelinePlantInfo {
  const plantType = plant?.plant_types
    ? (Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types)
    : null;

  return {
    id: plant?.id ?? "",
    name: plant?.name ?? "Unknown Plant",
    plant_type_id: plant?.plant_type_id ?? null,
    plant_types: plantType ? { id: plantType.id, name: plantType.name } : null,
  };
}

export async function getTimelineEventsForUser(
  userId: string,
  options?: TimelineOptions
): Promise<{ events: TimelineEvent[]; error: string | null }> {
  "use cache";
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();

  let query = supabase
    .from("plant_events")
    .select(`
      id,
      event_type,
      event_date,
      notes,
      metadata,
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
    .order("event_date", { ascending: false });

  if (options?.plantId) {
    query = query.eq("plant_id", options.plantId);
  }
  if (options?.eventType) {
    query = query.eq("event_type", options.eventType);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching timeline events:", error);
    return { events: [], error: error.message };
  }

  const events: TimelineEvent[] = (data || []).map((event) => {
    const plant = Array.isArray(event.plants) ? event.plants[0] : event.plants;
    return {
      id: event.id,
      event_type: event.event_type,
      event_date: event.event_date,
      notes: event.notes,
      metadata: event.metadata,
      plant_id: event.plant_id,
      plant: normalizePlantType(plant),
    };
  });

  return { events, error: null };
}

export async function getTimelineIssuesForUser(
  userId: string,
  options?: TimelineOptions
): Promise<{ issues: TimelineIssue[]; error: string | null }> {
  "use cache";
  cacheTag(userTag(userId, "issues"));

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
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching timeline issues:", error);
    return { issues: [], error: error.message };
  }

  const issues: TimelineIssue[] = (data || []).map((issue) => {
    const plant = Array.isArray(issue.plants) ? issue.plants[0] : issue.plants;
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
      plant: normalizePlantType(plant),
    };
  });

  return { issues, error: null };
}

export async function getTimelineJournalEntriesForUser(
  userId: string,
  options?: TimelineOptions
): Promise<{ entries: TimelineJournalEntry[]; error: string | null }> {
  "use cache";
  cacheTag(userTag(userId, "journal"));

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
    console.error("Error fetching timeline journal entries:", error);
    return { entries: [], error: error.message };
  }

  const entries: TimelineJournalEntry[] = (data || []).map((entry) => {
    const plant = Array.isArray(entry.plants) ? entry.plants[0] : entry.plants;
    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      entry_date: entry.entry_date,
      created_at: entry.created_at,
      event_id: entry.event_id ?? null,
      plant_id: entry.plant_id,
      plant: normalizePlantType(plant),
    };
  });

  return { entries, error: null };
}
