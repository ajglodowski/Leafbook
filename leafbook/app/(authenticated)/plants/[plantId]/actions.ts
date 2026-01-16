"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Journal Entry Helpers for Auto-Generated Entries
// ============================================================================

const ACQUISITION_JOURNAL_TITLE = "New plant";
const REPOT_JOURNAL_TITLE = "Repotted";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PotDetails {
  name: string;
  size_inches: number | null;
  material: string | null;
}

function buildRepotJournalContent(
  fromPot: PotDetails | null,
  toPot: PotDetails | null,
  eventDate: string
): string {
  const lines: string[] = [];

  if (fromPot) {
    const fromDetails = [
      fromPot.name,
      fromPot.size_inches ? `${fromPot.size_inches}"` : null,
      fromPot.material,
    ].filter(Boolean).join(" · ");
    lines.push(`From: ${fromDetails}`);
  }

  if (toPot) {
    const toDetails = [
      toPot.name,
      toPot.size_inches ? `${toPot.size_inches}"` : null,
      toPot.material,
    ].filter(Boolean).join(" · ");
    lines.push(`To: ${toDetails}`);
  }

  if (!fromPot && !toPot) {
    lines.push("Moved to a new pot.");
  }

  lines.push(`Date: ${formatDate(eventDate)}`);

  return lines.join("\n");
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

export async function logRepotEvent(
  plantId: string,
  data: {
    eventDate?: string; // ISO date string for backdating
    fromPotId?: string | null;
    toPotId?: string | null;
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
    .select("id, current_pot_id")
    .eq("id", plantId)
    .eq("user_id", user.id)
    .single();

  if (plantError || !plant) {
    return { success: false, error: "Plant not found" };
  }

  // If a target pot is specified, verify user owns it
  if (data.toPotId) {
    const { data: pot, error: potError } = await supabase
      .from("user_pots")
      .select("id")
      .eq("id", data.toPotId)
      .eq("user_id", user.id)
      .single();

    if (potError || !pot) {
      return { success: false, error: "Pot not found" };
    }
  }

  // Use provided date or default to now
  const dateToUse = data.eventDate ? new Date(data.eventDate).toISOString() : new Date().toISOString();

  // Build metadata for the repot event
  const metadata: Record<string, string | null> = {};
  if (data.fromPotId || plant.current_pot_id) {
    metadata.from_pot_id = data.fromPotId ?? plant.current_pot_id;
  }
  if (data.toPotId) {
    metadata.to_pot_id = data.toPotId;
  }

  // Insert the repot event
  const { error: eventError } = await supabase
    .from("plant_events")
    .insert({
      plant_id: plantId,
      user_id: user.id,
      event_type: "repotted",
      event_date: dateToUse,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    });

  if (eventError) {
    console.error("Error logging repot event:", eventError);
    return { success: false, error: eventError.message };
  }

  // Update the plant's current_pot_id
  const { error: updateError } = await supabase
    .from("plants")
    .update({
      current_pot_id: data.toPotId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", plantId);

  if (updateError) {
    console.error("Error updating plant pot:", updateError);
    // Event was logged, so we don't fail completely
  }

  // Create a journal entry for the repot
  const fromPotId = data.fromPotId ?? plant.current_pot_id;
  let fromPot: PotDetails | null = null;
  let toPot: PotDetails | null = null;

  // Fetch pot details if IDs are provided
  if (fromPotId) {
    const { data: potData } = await supabase
      .from("user_pots")
      .select("name, size_inches, material")
      .eq("id", fromPotId)
      .single();
    if (potData) {
      fromPot = potData;
    }
  }

  if (data.toPotId) {
    const { data: potData } = await supabase
      .from("user_pots")
      .select("name, size_inches, material")
      .eq("id", data.toPotId)
      .single();
    if (potData) {
      toPot = potData;
    }
  }

  const repotContent = buildRepotJournalContent(fromPot, toPot, dateToUse);

  const { error: journalError } = await supabase.from("journal_entries").insert({
    plant_id: plantId,
    user_id: user.id,
    title: REPOT_JOURNAL_TITLE,
    content: repotContent,
    entry_date: dateToUse,
  });

  if (journalError) {
    console.error("Error creating repot journal entry:", journalError);
    // Don't fail the whole operation if journal entry fails
  }

  revalidatePath("/today");
  revalidatePath("/plants");
  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/pots");
  revalidatePath("/journal");

  return { success: true };
}

export async function updatePlant(
  plantId: string,
  data: {
    name?: string;
    nickname?: string | null;
    plant_location?: "indoor" | "outdoor";
    location?: string | null;
    light_exposure?: string | null;
    size_category?: string | null;
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

  // Fetch the current plant data to detect acquired_at changes
  const { data: plant, error: plantError } = await supabase
    .from("plants")
    .select("id, name, plant_location, location, how_acquired, acquired_at, description")
    .eq("id", plantId)
    .eq("user_id", user.id)
    .single();

  if (plantError || !plant) {
    return { success: false, error: "Plant not found" };
  }

  const oldAcquiredAt = plant.acquired_at;

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

  // If acquired_at changed, update the most recent "New plant" journal entry
  if (data.acquired_at !== undefined && data.acquired_at !== oldAcquiredAt) {
    // Find the most recent "New plant" journal entry for this plant
    const { data: journalEntry } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("plant_id", plantId)
      .eq("user_id", user.id)
      .eq("title", ACQUISITION_JOURNAL_TITLE)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (journalEntry) {
      // Build updated content with current plant data merged with updates
      const updatedName = data.name ?? plant.name;
      const updatedPlantLocation = data.plant_location ?? plant.plant_location ?? "indoor";
      const updatedLocation = data.location !== undefined ? data.location : plant.location;
      const updatedHowAcquired = data.how_acquired !== undefined ? data.how_acquired : plant.how_acquired;
      const updatedDescription = data.description !== undefined ? data.description : plant.description;
      const newAcquiredAt = data.acquired_at;

      const now = new Date().toISOString();
      const updatedContent = buildAcquisitionJournalContent({
        name: updatedName,
        plantLocation: updatedPlantLocation as "indoor" | "outdoor",
        location: updatedLocation,
        howAcquired: updatedHowAcquired,
        acquiredAt: newAcquiredAt,
        description: updatedDescription,
        entryDate: newAcquiredAt || now,
      });

      const { error: journalError } = await supabase
        .from("journal_entries")
        .update({
          content: updatedContent,
          entry_date: newAcquiredAt ? new Date(newAcquiredAt).toISOString() : now,
        })
        .eq("id", journalEntry.id);

      if (journalError) {
        console.error("Error updating acquisition journal entry:", journalError);
        // Don't fail the whole operation
      }

      revalidatePath("/journal");
    }
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

export async function createPlantPhoto(
  plantId: string,
  data: {
    url: string;
    caption: string | null;
    takenAt: string;
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

  // Insert the photo record
  const { error } = await supabase.from("plant_photos").insert({
    plant_id: plantId,
    user_id: user.id,
    url: data.url,
    caption: data.caption,
    taken_at: data.takenAt,
  });

  if (error) {
    console.error("Error creating plant photo:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${plantId}`);

  return { success: true };
}

export async function deletePlantPhoto(photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the photo to get the URL and verify ownership
  const { data: photo, error: photoError } = await supabase
    .from("plant_photos")
    .select("id, url, plant_id")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .single();

  if (photoError || !photo) {
    return { success: false, error: "Photo not found" };
  }

  // Delete from Vercel Blob
  try {
    await del(photo.url);
  } catch (error) {
    console.error("Error deleting from blob storage:", error);
    // Continue to delete from DB even if blob deletion fails
  }

  // Delete from database
  const { error } = await supabase
    .from("plant_photos")
    .delete()
    .eq("id", photoId);

  if (error) {
    console.error("Error deleting plant photo:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${photo.plant_id}`);

  return { success: true };
}

export async function updatePlantPhotoMetadata(
  photoId: string,
  data: {
    takenAt: string;
    caption: string | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the photo to verify ownership
  const { data: photo, error: photoError } = await supabase
    .from("plant_photos")
    .select("id, plant_id")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .single();

  if (photoError || !photo) {
    return { success: false, error: "Photo not found" };
  }

  // Update the photo metadata
  const { error } = await supabase
    .from("plant_photos")
    .update({
      taken_at: data.takenAt,
      caption: data.caption,
    })
    .eq("id", photoId);

  if (error) {
    console.error("Error updating plant photo:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${photo.plant_id}`);

  return { success: true };
}

export async function setPlantActivePhoto(
  plantId: string,
  photoId: string | null
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

  // If setting an active photo (not clearing), verify the photo belongs to this plant
  if (photoId) {
    const { data: photo, error: photoError } = await supabase
      .from("plant_photos")
      .select("id")
      .eq("id", photoId)
      .eq("plant_id", plantId)
      .eq("user_id", user.id)
      .single();

    if (photoError || !photo) {
      return { success: false, error: "Photo not found or does not belong to this plant" };
    }
  }

  // Update the plant's active photo
  const { error } = await supabase
    .from("plants")
    .update({
      active_photo_id: photoId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", plantId);

  if (error) {
    console.error("Error setting active photo:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/plants");
  revalidatePath(`/plants/${plantId}`);

  return { success: true };
}

// ============================================================================
// Journal Entry Actions
// ============================================================================

export async function createJournalEntry(
  plantId: string,
  data: {
    title?: string | null;
    content: string;
    entryAt?: string; // ISO date string for backdating
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

  if (!data.content?.trim()) {
    return { success: false, error: "Content is required" };
  }

  // Use provided date or default to now
  const entryDate = data.entryAt ? new Date(data.entryAt).toISOString() : new Date().toISOString();

  const { error } = await supabase.from("journal_entries").insert({
    plant_id: plantId,
    user_id: user.id,
    title: data.title?.trim() || null,
    content: data.content.trim(),
    entry_date: entryDate,
  });

  if (error) {
    console.error("Error creating journal entry:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/journal");

  return { success: true };
}

export async function updateJournalEntry(
  entryId: string,
  data: {
    title?: string | null;
    content: string;
    entryAt?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the entry to verify ownership
  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .select("id, plant_id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (entryError || !entry) {
    return { success: false, error: "Journal entry not found" };
  }

  if (!data.content?.trim()) {
    return { success: false, error: "Content is required" };
  }

  const updateData: Record<string, unknown> = {
    title: data.title?.trim() || null,
    content: data.content.trim(),
  };

  if (data.entryAt) {
    updateData.entry_date = new Date(data.entryAt).toISOString();
  }

  const { error } = await supabase
    .from("journal_entries")
    .update(updateData)
    .eq("id", entryId);

  if (error) {
    console.error("Error updating journal entry:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${entry.plant_id}`);
  revalidatePath("/journal");

  return { success: true };
}

export async function deleteJournalEntry(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the entry to verify ownership and get plant_id
  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .select("id, plant_id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (entryError || !entry) {
    return { success: false, error: "Journal entry not found" };
  }

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    console.error("Error deleting journal entry:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${entry.plant_id}`);
  revalidatePath("/journal");

  return { success: true };
}

// ============================================================================
// Plant Issue Actions
// ============================================================================

export type IssueType =
  | "pest"
  | "disease"
  | "overwatering"
  | "underwatering"
  | "sunburn"
  | "etiolation"
  | "nutrient_deficiency"
  | "root_rot"
  | "dropping_leaves"
  | "yellowing"
  | "browning"
  | "wilting"
  | "other";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export type IssueStatus = "active" | "resolved" | "monitoring";

export async function createPlantIssue(
  plantId: string,
  data: {
    issueType: IssueType;
    severity: IssueSeverity;
    description?: string | null;
    startedAt?: string; // ISO date string for backdating
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

  // Use provided date or default to today
  const startDate = data.startedAt
    ? new Date(data.startedAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("plant_issues").insert({
    plant_id: plantId,
    user_id: user.id,
    issue_type: data.issueType,
    severity: data.severity,
    description: data.description?.trim() || null,
    started_at: startDate,
    status: "active",
  });

  if (error) {
    console.error("Error creating plant issue:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/journal");

  return { success: true };
}

export async function updatePlantIssue(
  issueId: string,
  data: {
    issueType?: IssueType;
    severity?: IssueSeverity;
    description?: string | null;
    startedAt?: string;
    status?: IssueStatus;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the issue to verify ownership
  const { data: issue, error: issueError } = await supabase
    .from("plant_issues")
    .select("id, plant_id")
    .eq("id", issueId)
    .eq("user_id", user.id)
    .single();

  if (issueError || !issue) {
    return { success: false, error: "Issue not found" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.issueType !== undefined) {
    updateData.issue_type = data.issueType;
  }
  if (data.severity !== undefined) {
    updateData.severity = data.severity;
  }
  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null;
  }
  if (data.startedAt !== undefined) {
    updateData.started_at = new Date(data.startedAt).toISOString().split("T")[0];
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  const { error } = await supabase
    .from("plant_issues")
    .update(updateData)
    .eq("id", issueId);

  if (error) {
    console.error("Error updating plant issue:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${issue.plant_id}`);
  revalidatePath("/journal");

  return { success: true };
}

export async function resolvePlantIssue(
  issueId: string,
  data?: {
    resolvedAt?: string;
    resolutionNotes?: string | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the issue to verify ownership
  const { data: issue, error: issueError } = await supabase
    .from("plant_issues")
    .select("id, plant_id")
    .eq("id", issueId)
    .eq("user_id", user.id)
    .single();

  if (issueError || !issue) {
    return { success: false, error: "Issue not found" };
  }

  const resolvedDate = data?.resolvedAt
    ? new Date(data.resolvedAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("plant_issues")
    .update({
      status: "resolved",
      resolved_at: resolvedDate,
      resolution_notes: data?.resolutionNotes?.trim() || null,
    })
    .eq("id", issueId);

  if (error) {
    console.error("Error resolving plant issue:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${issue.plant_id}`);
  revalidatePath("/journal");

  return { success: true };
}

export async function deletePlantIssue(issueId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the issue to verify ownership and get plant_id
  const { data: issue, error: issueError } = await supabase
    .from("plant_issues")
    .select("id, plant_id")
    .eq("id", issueId)
    .eq("user_id", user.id)
    .single();

  if (issueError || !issue) {
    return { success: false, error: "Issue not found" };
  }

  const { error } = await supabase
    .from("plant_issues")
    .delete()
    .eq("id", issueId);

  if (error) {
    console.error("Error deleting plant issue:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/plants/${issue.plant_id}`);
  revalidatePath("/journal");

  return { success: true };
}
