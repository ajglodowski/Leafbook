"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";

// ============================================================================
// Journal Entry Helpers for Acquisition
// ============================================================================

const ACQUISITION_JOURNAL_TITLE = "New plant";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface AcquisitionDetails {
  name: string;
  plantLocation: "indoor" | "outdoor";
  location: string | null;
  howAcquired: string | null;
  acquiredAt: string | null;
  description: string | null;
  entryDate: string; // fallback date if acquiredAt is null
}

function buildAcquisitionJournalContent(details: AcquisitionDetails): string {
  const lines: string[] = [];

  lines.push(`Welcome, ${details.name}!`);

  const envLabel = details.plantLocation === "indoor" ? "Indoor" : "Outdoor";
  if (details.location) {
    lines.push(`Environment: ${envLabel} · ${details.location}`);
  } else {
    lines.push(`Environment: ${envLabel}`);
  }

  if (details.howAcquired) {
    lines.push(`Source: ${details.howAcquired}`);
  }

  // Use acquiredAt if available, otherwise fallback to entry date with a different label
  if (details.acquiredAt) {
    lines.push(`Acquired: ${formatDate(details.acquiredAt)}`);
  } else {
    lines.push(`Logged on: ${formatDate(details.entryDate)}`);
  }

  if (details.description) {
    lines.push("");
    lines.push(details.description);
  }

  return lines.join("\n");
}

export async function createPlant(formData: FormData) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const name = formData.get("name") as string;
  const plantTypeId = formData.get("plantTypeId") as string | null;
  const nickname = formData.get("nickname") as string | null;
  const plantLocation = (formData.get("plant_location") as "indoor" | "outdoor") || "indoor";
  const location = formData.get("location") as string | null;
  const lightExposure = formData.get("light_exposure") as string | null;
  const sizeCategory = formData.get("size_category") as string | null;
  const howAcquired = formData.get("how_acquired") as string | null;
  const acquiredAt = formData.get("acquired_at") as string | null;
  const description = formData.get("description") as string | null;

  if (!plantTypeId?.trim()) {
    return { success: false, error: "Plant type is required" };
  }

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const now = new Date().toISOString();

  const { data: plant, error } = await supabase
    .from("plants")
    .insert({
      user_id: userId,
      name: name.trim(),
      nickname: nickname?.trim() || null,
      plant_type_id: plantTypeId,
      plant_location: plantLocation,
      location: location?.trim() || null,
      light_exposure: lightExposure || null,
      size_category: sizeCategory || null,
      how_acquired: howAcquired?.trim() || null,
      acquired_at: acquiredAt || null,
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating plant:", error);
    return { success: false, error: error.message };
  }

  // Create an acquisition journal entry
  const journalContent = buildAcquisitionJournalContent({
    name: name.trim(),
    plantLocation,
    location: location?.trim() || null,
    howAcquired: howAcquired?.trim() || null,
    acquiredAt: acquiredAt || null,
    description: description?.trim() || null,
    entryDate: acquiredAt || now,
  });

  const { error: journalError } = await supabase.from("journal_entries").insert({
    plant_id: plant.id,
    user_id: userId,
    title: ACQUISITION_JOURNAL_TITLE,
    content: journalContent,
    entry_date: acquiredAt ? new Date(acquiredAt).toISOString() : now,
  });

  if (journalError) {
    console.error("Error creating acquisition journal entry:", journalError);
    // Don't fail the whole operation if journal entry fails
  }

  revalidatePath("/plants");
  revalidatePath("/");
  revalidatePath("/journal");
  
  return { success: true, plantId: plant.id };
}

export type PlantWithTypes = {
  id: string;
  name: string;
  nickname: string | null;
  plant_location: "indoor" | "outdoor" | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  plant_type_id: string | null;
  active_photo_id: string | null;
  plant_types:
    | {
        id: string;
        name: string;
        scientific_name: string | null;
      }[]
    | null;
};

export type PlantTypeSummary = {
  id: string;
  name: string;
  scientific_name: string | null;
};

export type PlantDueTask = {
  plant_id: string;
  watering_status: string | null;
  fertilizing_status: string | null;
};

export type PlantPhoto = {
  id: string;
  plant_id: string;
  url: string;
};

interface FetchResult<T> {
  data: T[];
  error?: string | null;
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return { id: userId };
}

export async function getPlantsForUser(userId: string): Promise<FetchResult<PlantWithTypes>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plants")
    .select(`
      id,
      name,
      nickname,
      plant_location,
      location,
      is_active,
      created_at,
      plant_type_id,
      active_photo_id,
      plant_types (
        id,
        name,
        scientific_name
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return { data: data || [], error: error?.message };
}

export async function getPlantTypes(): Promise<FetchResult<PlantTypeSummary>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plant_types")
    .select("id, name, scientific_name")
    .order("name", { ascending: true });

  return { data: data || [], error: error?.message };
}

export async function getDueTasksForUser(userId: string): Promise<FetchResult<PlantDueTask>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_plant_due_tasks")
    .select("plant_id, watering_status, fertilizing_status")
    .eq("user_id", userId);

  return { data: data || [], error: error?.message };
}

export async function getPlantPhotosForPlants(
  plantIds: string[]
): Promise<FetchResult<PlantPhoto>> {
  if (plantIds.length === 0) {
    return { data: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plant_photos")
    .select("id, plant_id, url")
    .in("plant_id", plantIds)
    .order("taken_at", { ascending: false });

  return { data: data || [], error: error?.message };
}

export async function logCareEvent(
  plantId: string, 
  eventType: "watered" | "fertilized" | "repotted"
) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("plant_events")
    .insert({
      plant_id: plantId,
      user_id: userId,
      event_type: eventType,
      event_date: new Date().toISOString(),
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
