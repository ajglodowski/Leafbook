"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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
      user_id: user.id,
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
    user_id: user.id,
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

export async function logCareEvent(
  plantId: string, 
  eventType: "watered" | "fertilized" | "repotted"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("plant_events")
    .insert({
      plant_id: plantId,
      user_id: user.id,
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
