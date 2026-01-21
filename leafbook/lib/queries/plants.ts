import { cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import {
  carePreferencesTags,
  plantDetailTags,
  recordTag,
  scopedListTag,
  tableTag,
  userTag,
} from "@/lib/cache-tags";

// Type exports for actions files
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

export type PlantTypeOrigin = {
  country_code: string;
  region: string | null;
};

export type PlantWithOrigin = {
  id: string;
  name: string;
  plant_type_id: string | null;
  plant_types: {
    id: string;
    name: string;
    plant_type_origins: PlantTypeOrigin[];
  }[] | null;
};

export type OriginStats = {
  countries: Record<string, { count: number; region: string; plants: { id: string; name: string }[] }>;
  regions: Record<string, number>;
  totalWithOrigin: number;
  totalWithoutOrigin: number;
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

/**
 * Get plants for a user.
 */
export async function getPlantsForUser(userId: string): Promise<FetchResult<PlantWithTypes>> {
  "use cache";
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();
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

/**
 * Get all plant types.
 */
export async function getPlantTypes(): Promise<FetchResult<PlantTypeSummary>> {
  "use cache";
  cacheTag(tableTag("plant-types"));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("plant_types")
    .select("id, name, scientific_name")
    .order("name", { ascending: true });

  return { data: data || [], error: error?.message };
}

/**
 * Get due tasks for a user.
 */
export async function getDueTasksForUserList(userId: string): Promise<FetchResult<PlantDueTask>> {
  "use cache";
  cacheTag(userTag(userId, "due-tasks"));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("v_plant_due_tasks")
    .select("plant_id, watering_status, fertilizing_status")
    .eq("user_id", userId);

  return { data: data || [], error: error?.message };
}

/**
 * Get photos for multiple plants.
 */
export async function getPlantPhotosForPlants(
  plantIds: string[]
): Promise<FetchResult<PlantPhoto>> {
  "use cache";
  // Tag with each plant's photo list
  plantIds.forEach((id) => cacheTag(scopedListTag("plant-photos", id)));

  if (plantIds.length === 0) {
    return { data: [] };
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("plant_photos")
    .select("id, plant_id, url")
    .in("plant_id", plantIds)
    .order("taken_at", { ascending: false });

  return { data: data || [], error: error?.message };
}

/**
 * Get plant with full details including plant type.
 */
export async function getPlantDetail(plantId: string, userId: string) {
  "use cache";
  cacheTag(...plantDetailTags(userId, plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plants")
    .select(`
      id,
      name,
      nickname,
      plant_location,
      location,
      light_exposure,
      size_category,
      is_active,
      created_at,
      acquired_at,
      how_acquired,
      description,
      plant_type_id,
      active_photo_id,
      current_pot_id,
      parent_plant_id,
      plant_types (
        id,
        name,
        scientific_name,
        watering_frequency_days,
        fertilizing_frequency_days,
        light_min,
        light_max,
        description
      )
    `)
    .eq("id", plantId)
    .eq("user_id", userId)
    .single();

  return { data, error };
}

/**
 * Get care events for a plant.
 */
export async function getPlantEvents(plantId: string) {
  "use cache";
  cacheTag(scopedListTag("plant-events", plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_events")
    .select("id, event_type, event_date, notes, metadata")
    .eq("plant_id", plantId)
    .order("event_date", { ascending: false })
    .limit(20);

  return { data, error };
}

/**
 * Get journal entries for a plant.
 */
export async function getPlantJournalEntries(plantId: string) {
  "use cache";
  cacheTag(scopedListTag("journal-entries", plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, title, content, entry_date")
    .eq("plant_id", plantId)
    .order("entry_date", { ascending: false })
    .limit(20);

  return { data, error };
}

/**
 * Get issues for a plant.
 */
export async function getPlantIssues(plantId: string) {
  "use cache";
  cacheTag(scopedListTag("plant-issues", plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_issues")
    .select("id, issue_type, severity, status, description, started_at, resolved_at, resolution_notes")
    .eq("plant_id", plantId)
    .order("started_at", { ascending: false })
    .limit(20);

  return { data, error };
}

/**
 * Get due task status for a plant.
 */
export async function getPlantDueTask(plantId: string) {
  "use cache";
  cacheTag(recordTag("plant", plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("v_plant_due_tasks")
    .select("*")
    .eq("plant_id", plantId)
    .single();

  return { data, error };
}

/**
 * Get care preferences for a plant.
 */
export async function getPlantCarePreferences(plantId: string) {
  "use cache";
  cacheTag(...carePreferencesTags(plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_care_preferences")
    .select("watering_frequency_days, fertilizing_frequency_days")
    .eq("plant_id", plantId)
    .maybeSingle();

  return { data, error };
}

/**
 * Get watering events for schedule analysis.
 */
export async function getWateringEventsForAnalysis(plantId: string) {
  "use cache";
  cacheTag(scopedListTag("plant-events", plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_events")
    .select("event_date")
    .eq("plant_id", plantId)
    .eq("event_type", "watered")
    .order("event_date", { ascending: false })
    .limit(15);

  return { data, error };
}

/**
 * Get active schedule suggestion for a plant.
 */
export async function getActiveScheduleSuggestion(plantId: string) {
  "use cache";
  cacheTag(recordTag("plant", plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("watering_schedule_suggestions")
    .select("*")
    .eq("plant_id", plantId)
    .is("dismissed_at", null)
    .is("accepted_at", null)
    .maybeSingle();

  return { data, error };
}

/**
 * Get photos for a plant.
 */
export async function getPlantPhotos(plantId: string) {
  "use cache";
  cacheTag(scopedListTag("plant-photos", plantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_photos")
    .select("id, url, caption, taken_at")
    .eq("plant_id", plantId)
    .order("taken_at", { ascending: false });

  return { data, error };
}

/**
 * Get user's pots with usage info.
 */
export async function getUserPotsWithPlantUsage(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "pots"));
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();

  // Fetch pots
  const { data: pots, error: potsError } = await supabase
    .from("user_pots")
    .select("id, name, size_inches, material, photo_url, is_retired, has_drainage, color")
    .eq("user_id", userId)
    .order("is_retired", { ascending: true })
    .order("size_inches", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (potsError) {
    return { pots: [], activePlants: [], error: potsError };
  }

  // Fetch active plants with pot assignments
  const { data: activePlants, error: plantsError } = await supabase
    .from("plants")
    .select("id, name, current_pot_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .not("current_pot_id", "is", null);

  return { pots: pots || [], activePlants: activePlants || [], error: plantsError };
}

// ============================================================================
// PROPAGATION QUERIES
// ============================================================================

export type ParentPlantSummary = {
  id: string;
  name: string;
  nickname: string | null;
  active_photo_id: string | null;
};

export type ChildPlantSummary = {
  id: string;
  name: string;
  nickname: string | null;
  active_photo_id: string | null;
  created_at: string;
};

/**
 * Get parent plant info for a plant.
 */
export async function getParentPlant(parentPlantId: string, userId: string) {
  "use cache";
  cacheTag(recordTag("plant", parentPlantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plants")
    .select("id, name, nickname, active_photo_id")
    .eq("id", parentPlantId)
    .eq("user_id", userId)
    .single();

  return { data, error };
}

/**
 * Get children plants (plants that have this plant as parent).
 */
export async function getChildrenPlants(plantId: string, userId: string) {
  "use cache";
  cacheTag(scopedListTag("plant-children", plantId));
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plants")
    .select("id, name, nickname, active_photo_id, created_at")
    .eq("parent_plant_id", plantId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

/**
 * Get all plants for a user (for parent selection in dialogs).
 * Returns minimal info for combobox/select usage.
 */
export async function getPlantsForParentSelection(userId: string, excludePlantId?: string) {
  "use cache";
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();

  let query = supabase
    .from("plants")
    .select("id, name, nickname")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Exclude the current plant (can't be its own parent)
  if (excludePlantId) {
    query = query.neq("id", excludePlantId);
  }

  const { data, error } = await query;

  return { data: data || [], error };
}

// ============================================================================
// ORIGIN QUERIES (for Origin Map)
// ============================================================================

/**
 * Get plants with origin data for a user.
 * Uses the plant_type_origins join table for multi-country support.
 */
export async function getPlantsWithOrigin(userId: string): Promise<FetchResult<PlantWithOrigin>> {
  "use cache";
  cacheTag(userTag(userId, "plants"));
  cacheTag(tableTag("plant-types"));
  cacheTag(tableTag("plant-type-origins"));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("plants")
    .select(`
      id,
      name,
      plant_type_id,
      plant_types (
        id,
        name,
        plant_type_origins (
          country_code,
          region
        )
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true);

  return { data: data || [], error: error?.message };
}

/**
 * Compute origin statistics from plants with origin data.
 * Groups plants by country and region.
 * Supports multiple origin countries per plant type.
 */
export function computeOriginStats(plants: PlantWithOrigin[]): OriginStats {
  const countries: OriginStats["countries"] = {};
  const regions: Record<string, number> = {};
  let totalWithOrigin = 0;
  let totalWithoutOrigin = 0;
  
  // Track which plants we've already counted for each country (to avoid double-counting)
  const plantCountedForCountry = new Map<string, Set<string>>();

  for (const plant of plants) {
    const plantType = Array.isArray(plant.plant_types) 
      ? plant.plant_types[0] 
      : plant.plant_types;
    
    const origins = plantType?.plant_type_origins || [];
    const regionsCountedForPlant = new Set<string>();
    
    if (origins.length > 0) {
      totalWithOrigin++;
      
      // A plant contributes once to each country/region it's from
      for (const origin of origins) {
        const countryCode = origin.country_code;
        const region = origin.region;
        
        if (countryCode) {
          // Initialize tracking set for this country if needed
          if (!plantCountedForCountry.has(countryCode)) {
            plantCountedForCountry.set(countryCode, new Set());
          }
          
          // Only count this plant once per country
          if (!plantCountedForCountry.get(countryCode)!.has(plant.id)) {
            plantCountedForCountry.get(countryCode)!.add(plant.id);
            
            // Update country stats
            if (!countries[countryCode]) {
              countries[countryCode] = { count: 0, region: region || "Unknown", plants: [] };
            }
            countries[countryCode].count++;
            countries[countryCode].plants.push({ id: plant.id, name: plant.name });
          }
        }

        // Update region stats (count each plant once per region)
        if (region && !regionsCountedForPlant.has(region)) {
          regionsCountedForPlant.add(region);
          regions[region] = (regions[region] || 0) + 1;
        }
      }
    } else {
      totalWithoutOrigin++;
    }
  }

  return {
    countries,
    regions,
    totalWithOrigin,
    totalWithoutOrigin,
  };
}
