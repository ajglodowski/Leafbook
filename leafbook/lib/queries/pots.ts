import { cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { userTag } from "@/lib/cache-tags";

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

export async function getUserPotsForUser(userId: string, includeRetired = false) {
  "use cache";
  cacheTag(userTag(userId, "pots"));

  const supabase = createPublicClient();

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

/**
 * Get all pots with usage information (which plant is using each pot).
 * "In use" means assigned to an active plant (is_active=true).
 */
export async function getPotsWithUsageForUser(
  userId: string,
  includeRetired = true
): Promise<PotWithUsage[]> {
  "use cache";
  cacheTag(userTag(userId, "pots"));
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();

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
 */
export async function getRecommendedPotsForRepotForUser(
  userId: string,
  currentPotId: string | null,
  currentPotSizeInches: number | null
): Promise<PotWithUsage[]> {
  const allPots = await getPotsWithUsageForUser(userId, false); // exclude retired

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
 */
export async function getUnusedPotsForUser(userId: string): Promise<PotWithUsage[]> {
  const allPots = await getPotsWithUsageForUser(userId, false); // exclude retired
  return allPots.filter((pot) => !pot.in_use);
}
