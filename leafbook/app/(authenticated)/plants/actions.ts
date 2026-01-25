"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  careEventMutationTags,
  plantMutationTags,
  plantTypeDetailTags,
  propagationMutationTags,
  userTag,
} from "@/lib/cache-tags";
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

  // Invalidate cache tags (userId is guaranteed string after redirect guard)
  plantMutationTags(userId as string, plant.id).forEach((tag) => updateTag(tag));
  updateTag(userTag(userId as string, "journal"));
  if (plantTypeId) {
    plantTypeDetailTags(plantTypeId).forEach((tag) => updateTag(tag));
  }
  
  return { success: true, plantId: plant.id };
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return { id: userId };
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

  // Invalidate cache tags for the affected plant and user's due tasks
  careEventMutationTags(userId as string, plantId).forEach((tag) => updateTag(tag));
  
  return { success: true };
}

// ============================================================================
// PROPAGATION ACTIONS
// ============================================================================

/**
 * Set a parent plant for a plant (create propagation link).
 * Also logs a 'propagated' event on the child plant.
 */
export async function setParentPlant(
  childPlantId: string,
  parentPlantId: string,
  propagationDate?: string
) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Prevent self-reference
  if (childPlantId === parentPlantId) {
    return { success: false, error: "A plant cannot be its own parent" };
  }

  // Verify both plants belong to the current user
  const { data: plants, error: verifyError } = await supabase
    .from("plants")
    .select("id")
    .eq("user_id", userId)
    .in("id", [childPlantId, parentPlantId]);

  if (verifyError || !plants || plants.length !== 2) {
    return { success: false, error: "Invalid plant selection" };
  }

  // Update the child plant with the parent reference
  const { error: updateError } = await supabase
    .from("plants")
    .update({ parent_plant_id: parentPlantId })
    .eq("id", childPlantId)
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error setting parent plant:", updateError);
    return { success: false, error: updateError.message };
  }

  // Log a 'propagated' event on the child plant
  const eventDate = propagationDate ? new Date(propagationDate).toISOString() : new Date().toISOString();
  const { error: eventError } = await supabase.from("plant_events").insert({
    plant_id: childPlantId,
    user_id: userId,
    event_type: "propagated",
    event_date: eventDate,
    metadata: { parent_plant_id: parentPlantId },
    notes: "Propagated from parent plant",
  });

  if (eventError) {
    console.error("Error logging propagation event:", eventError);
    // Don't fail the whole operation if event logging fails
  }

  // Invalidate cache tags
  propagationMutationTags(userId, childPlantId, parentPlantId).forEach((tag) =>
    updateTag(tag)
  );

  return { success: true };
}

/**
 * Clear a plant's parent (remove propagation link).
 */
export async function clearParentPlant(childPlantId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // First get the current parent so we can invalidate its cache
  const { data: plant } = await supabase
    .from("plants")
    .select("parent_plant_id")
    .eq("id", childPlantId)
    .eq("user_id", userId)
    .single();

  const previousParentId = plant?.parent_plant_id;

  // Update the child plant to remove parent reference
  const { error: updateError } = await supabase
    .from("plants")
    .update({ parent_plant_id: null })
    .eq("id", childPlantId)
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error clearing parent plant:", updateError);
    return { success: false, error: updateError.message };
  }

  // Invalidate cache tags
  propagationMutationTags(userId, childPlantId, previousParentId).forEach((tag) =>
    updateTag(tag)
  );

  return { success: true };
}

/**
 * Create a plant as a propagation from a parent plant.
 * This creates the plant, links it to the parent, and logs the propagation event.
 */
export async function createPropagatedPlant(formData: FormData) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const name = formData.get("name") as string;
  const parentPlantId = formData.get("parentPlantId") as string;
  const plantTypeId = formData.get("plantTypeId") as string | null;
  const nickname = formData.get("nickname") as string | null;
  const plantLocation = (formData.get("plant_location") as "indoor" | "outdoor") || "indoor";
  const location = formData.get("location") as string | null;
  const lightExposure = formData.get("light_exposure") as string | null;
  const propagationDate = formData.get("propagation_date") as string | null;
  const description = formData.get("description") as string | null;

  if (!parentPlantId?.trim()) {
    return { success: false, error: "Parent plant is required" };
  }

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  // Verify parent plant belongs to current user
  const { data: parentPlant, error: parentError } = await supabase
    .from("plants")
    .select("id, name, plant_type_id")
    .eq("id", parentPlantId)
    .eq("user_id", userId)
    .single();

  if (parentError || !parentPlant) {
    return { success: false, error: "Invalid parent plant" };
  }

  const now = new Date().toISOString();
  const eventDate = propagationDate ? new Date(propagationDate).toISOString() : now;

  // Use parent's plant type if not explicitly specified
  const effectivePlantTypeId = plantTypeId || parentPlant.plant_type_id;

  // Create the new plant with parent reference
  const { data: plant, error } = await supabase
    .from("plants")
    .insert({
      user_id: userId,
      name: name.trim(),
      nickname: nickname?.trim() || null,
      plant_type_id: effectivePlantTypeId,
      parent_plant_id: parentPlantId,
      plant_location: plantLocation,
      location: location?.trim() || null,
      light_exposure: lightExposure || null,
      how_acquired: `Propagated from ${parentPlant.name}`,
      acquired_at: propagationDate || null,
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating propagated plant:", error);
    return { success: false, error: error.message };
  }

  // Log a 'propagated' event on the child plant
  const { error: eventError } = await supabase.from("plant_events").insert({
    plant_id: plant.id,
    user_id: userId,
    event_type: "propagated",
    event_date: eventDate,
    metadata: { parent_plant_id: parentPlantId },
    notes: `Propagated from ${parentPlant.name}`,
  });

  if (eventError) {
    console.error("Error logging propagation event:", eventError);
  }

  // Create a journal entry for the propagation
  const journalContent = `Welcome, ${name.trim()}!\n\nPropagated from ${parentPlant.name}.${description ? `\n\n${description.trim()}` : ""}`;
  
  const { error: journalError } = await supabase.from("journal_entries").insert({
    plant_id: plant.id,
    user_id: userId,
    title: "Propagation",
    content: journalContent,
    entry_date: eventDate,
  });

  if (journalError) {
    console.error("Error creating propagation journal entry:", journalError);
  }

  // Invalidate cache tags
  propagationMutationTags(userId, plant.id, parentPlantId).forEach((tag) =>
    updateTag(tag)
  );
  plantMutationTags(userId, plant.id).forEach((tag) => updateTag(tag));
  updateTag(userTag(userId, "journal"));

  return { success: true, plantId: plant.id };
}
