"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";
import { potMutationTags } from "@/lib/cache-tags";
import {
  getUserPotsForUser,
  getPotsWithUsageForUser,
  getRecommendedPotsForRepotForUser,
  getUnusedPotsForUser,
  type PotWithUsage,
} from "@/lib/queries/pots";

export interface PotData {
  name: string;
  size_inches?: number | null;
  material?: string | null;
  has_drainage?: boolean;
  color?: string | null;
  notes?: string | null;
}

export async function createPot(data: PotData) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  if (!data.name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const { data: pot, error } = await supabase
    .from("user_pots")
    .insert({
      user_id: userId,
      name: data.name.trim(),
      size_inches: data.size_inches,
      material: data.material?.trim() || null,
      has_drainage: data.has_drainage ?? true,
      color: data.color?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating pot:", error);
    return { success: false, error: error.message };
  }

  potMutationTags(userId, pot.id).forEach((tag) => updateTag(tag));
  return { success: true, potId: pot.id };
}

export async function updatePot(potId: string, data: Partial<PotData>) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Verify the pot belongs to this user
  const { data: pot, error: potError } = await supabase
    .from("user_pots")
    .select("id")
    .eq("id", potId)
    .eq("user_id", userId)
    .single();

  if (potError || !pot) {
    return { success: false, error: "Pot not found" };
  }

  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      return { success: false, error: "Name is required" };
    }
    updateData.name = data.name.trim();
  }
  if (data.size_inches !== undefined) updateData.size_inches = data.size_inches;
  if (data.material !== undefined) updateData.material = data.material?.trim() || null;
  if (data.has_drainage !== undefined) updateData.has_drainage = data.has_drainage;
  if (data.color !== undefined) updateData.color = data.color?.trim() || null;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

  const { error } = await supabase
    .from("user_pots")
    .update(updateData)
    .eq("id", potId);

  if (error) {
    console.error("Error updating pot:", error);
    return { success: false, error: error.message };
  }

  potMutationTags(userId, potId).forEach((tag) => updateTag(tag));
  return { success: true };
}

export async function retirePot(potId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("user_pots")
    .update({ is_retired: true })
    .eq("id", potId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error retiring pot:", error);
    return { success: false, error: error.message };
  }

  potMutationTags(userId, potId).forEach((tag) => updateTag(tag));
  return { success: true };
}

export async function unretirePot(potId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("user_pots")
    .update({ is_retired: false })
    .eq("id", potId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error unretiring pot:", error);
    return { success: false, error: error.message };
  }

  potMutationTags(userId, potId).forEach((tag) => updateTag(tag));
  return { success: true };
}

export async function deletePot(potId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Get the pot to check for photo and verify ownership
  const { data: pot, error: potError } = await supabase
    .from("user_pots")
    .select("id, photo_url")
    .eq("id", potId)
    .eq("user_id", userId)
    .single();

  if (potError || !pot) {
    return { success: false, error: "Pot not found" };
  }

  // Delete photo from blob storage if exists
  if (pot.photo_url) {
    try {
      await del(pot.photo_url);
    } catch (error) {
      console.error("Error deleting pot photo from blob:", error);
      // Continue with deletion even if blob delete fails
    }
  }

  const { error } = await supabase
    .from("user_pots")
    .delete()
    .eq("id", potId);

  if (error) {
    console.error("Error deleting pot:", error);
    return { success: false, error: error.message };
  }

  potMutationTags(userId, potId).forEach((tag) => updateTag(tag));
  return { success: true };
}

export async function setPotPhoto(potId: string, photoUrl: string | null) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Get current pot to check for existing photo
  const { data: pot, error: potError } = await supabase
    .from("user_pots")
    .select("id, photo_url")
    .eq("id", potId)
    .eq("user_id", userId)
    .single();

  if (potError || !pot) {
    return { success: false, error: "Pot not found" };
  }

  // Delete old photo from blob if replacing
  if (pot.photo_url && photoUrl !== pot.photo_url) {
    try {
      await del(pot.photo_url);
    } catch (error) {
      console.error("Error deleting old pot photo:", error);
    }
  }

  const { error } = await supabase
    .from("user_pots")
    .update({ photo_url: photoUrl })
    .eq("id", potId);

  if (error) {
    console.error("Error setting pot photo:", error);
    return { success: false, error: error.message };
  }

  potMutationTags(userId, potId).forEach((tag) => updateTag(tag));
  return { success: true };
}

// ============================================================================
// Pot Read Functions (wrappers with auth)
// ============================================================================

export async function getUserPots(includeRetired = false) {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return getUserPotsForUser(userId, includeRetired);
}

/**
 * Get all pots with usage information (which plant is using each pot).
 * "In use" means assigned to an active plant (is_active=true).
 */
export async function getPotsWithUsage(includeRetired = true): Promise<PotWithUsage[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return getPotsWithUsageForUser(userId, includeRetired);
}

/**
 * Get recommended pots for repotting a specific plant.
 */
export async function getRecommendedPotsForRepot(
  currentPotId: string | null,
  currentPotSizeInches: number | null
): Promise<PotWithUsage[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return getRecommendedPotsForRepotForUser(userId, currentPotId, currentPotSizeInches);
}

/**
 * Get all unused pots (for browsing inventory during repot).
 */
export async function getUnusedPots(): Promise<PotWithUsage[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return getUnusedPotsForUser(userId);
}
