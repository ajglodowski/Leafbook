"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";

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

  revalidatePath("/pots");
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

  revalidatePath("/pots");
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

  revalidatePath("/pots");
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

  revalidatePath("/pots");
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

  revalidatePath("/pots");
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

  revalidatePath("/pots");
  return { success: true };
}

export async function getUserPots(includeRetired = false) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  let query = supabase
    .from("user_pots")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!includeRetired) {
    query = query.eq("is_retired", false);
  }

  const { data: pots, error } = await query;

  if (error) {
    console.error("Error fetching pots:", error);
    return [];
  }

  return pots;
}

// ============================================================================
// Pot Inventory & Usage Helpers
// ============================================================================

export interface PotWithUsage {
  id: string;
  name: string;
  size_inches: number | null;
  material: string | null;
  has_drainage: boolean;
  color: string | null;
  notes: string | null;
  photo_url: string | null;
  is_retired: boolean;
  created_at: string;
  // Usage info
  in_use: boolean;
  used_by_plant_id: string | null;
  used_by_plant_name: string | null;
}

/**
 * Get all pots with usage information (which plant is using each pot).
 * "In use" means assigned to an active plant (is_active=true).
 */
export async function getPotsWithUsage(includeRetired = true): Promise<PotWithUsage[]> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Fetch all pots
  let potsQuery = supabase
    .from("user_pots")
    .select("*")
    .eq("user_id", userId)
    .order("is_retired", { ascending: true })
    .order("size_inches", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!includeRetired) {
    potsQuery = potsQuery.eq("is_retired", false);
  }

  const { data: pots, error: potsError } = await potsQuery;

  if (potsError) {
    console.error("Error fetching pots:", potsError);
    return [];
  }

  if (!pots || pots.length === 0) {
    return [];
  }

  // Fetch active plants with their current_pot_id
  const { data: activePlants } = await supabase
    .from("plants")
    .select("id, name, current_pot_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .not("current_pot_id", "is", null);

  // Build a map of pot_id -> plant info
  const potUsageMap = new Map<string, { plantId: string; plantName: string }>();
  if (activePlants) {
    for (const plant of activePlants) {
      if (plant.current_pot_id) {
        potUsageMap.set(plant.current_pot_id, {
          plantId: plant.id,
          plantName: plant.name,
        });
      }
    }
  }

  // Enrich pots with usage info
  return pots.map((pot) => {
    const usage = potUsageMap.get(pot.id);
    return {
      ...pot,
      in_use: !!usage,
      used_by_plant_id: usage?.plantId ?? null,
      used_by_plant_name: usage?.plantName ?? null,
    };
  });
}

/**
 * Get recommended pots for repotting a specific plant.
 * Rules:
 * - Exclude retired pots
 * - Exclude pots currently in use by active plants
 * - If current pot has a size, recommend pots where size_inches >= current AND <= current + 2
 * - If no current pot size, return all unused pots sorted by size
 */
export async function getRecommendedPotsForRepot(
  currentPotId: string | null,
  currentPotSizeInches: number | null
): Promise<PotWithUsage[]> {
  const allPots = await getPotsWithUsage(false); // exclude retired

  // Filter to unused pots (exclude the current pot itself)
  const unusedPots = allPots.filter(
    (pot) => !pot.in_use && pot.id !== currentPotId
  );

  // If current pot has a size, filter to [current, current + 2] range
  if (currentPotSizeInches !== null) {
    const minSize = currentPotSizeInches;
    const maxSize = currentPotSizeInches + 2;

    const recommended = unusedPots.filter(
      (pot) =>
        pot.size_inches !== null &&
        pot.size_inches >= minSize &&
        pot.size_inches <= maxSize
    );

    // Sort by size (smallest first)
    return recommended.sort((a, b) => {
      if (a.size_inches === null) return 1;
      if (b.size_inches === null) return -1;
      return a.size_inches - b.size_inches;
    });
  }

  // No current pot size: return all unused pots sorted by size then recency
  return unusedPots.sort((a, b) => {
    // Pots with size first, then by size ascending
    if (a.size_inches !== null && b.size_inches !== null) {
      return a.size_inches - b.size_inches;
    }
    if (a.size_inches !== null) return -1;
    if (b.size_inches !== null) return 1;
    // Both null size: sort by created_at descending
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Get all unused pots (for browsing inventory during repot).
 * Excludes retired pots.
 */
export async function getUnusedPots(): Promise<PotWithUsage[]> {
  const allPots = await getPotsWithUsage(false); // exclude retired
  return allPots.filter((pot) => !pot.in_use);
}
