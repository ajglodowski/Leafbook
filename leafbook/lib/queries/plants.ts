import { cacheTag } from "next/cache";

import {
  carePreferencesTags,
  plantDetailTags,
  recordTag,
  scopedListTag,
  tableTag,
  userTag,
} from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/server";

// Type exports for actions files
export type PlantWithTypes = {
  id: string;
  name: string;
  nickname: string | null;
  plant_location: "indoor" | "outdoor" | null;
  location: string | null;
  is_active: boolean;
  is_legacy: boolean;
  legacy_reason: string | null;
  legacy_at: string | null;
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
 * Get active (non-legacy) plants for a user.
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
      is_legacy,
      legacy_reason,
      legacy_at,
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
    .eq("is_legacy", false)
    .order("created_at", { ascending: false });

  return { data: data || [], error: error?.message };
}

/**
 * Get legacy plants for a user.
 */
export async function getLegacyPlantsForUser(userId: string): Promise<FetchResult<PlantWithTypes>> {
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
      is_legacy,
      legacy_reason,
      legacy_at,
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
    .eq("is_legacy", true)
    .order("legacy_at", { ascending: false, nullsFirst: false });

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
      is_legacy,
      legacy_reason,
      legacy_at,
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
    .select("id, title, content, entry_date, event_id")
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
  is_legacy: boolean;
};

export type ChildPlantSummary = {
  id: string;
  name: string;
  nickname: string | null;
  active_photo_id: string | null;
  is_legacy: boolean;
  created_at: string;
};

/**
 * Get parent plant info for a plant.
 * Includes legacy plants since parent relationships should persist.
 */
export async function getParentPlant(parentPlantId: string, userId: string) {
  "use cache";
  cacheTag(recordTag("plant", parentPlantId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plants")
    .select("id, name, nickname, active_photo_id, is_legacy")
    .eq("id", parentPlantId)
    .eq("user_id", userId)
    .single();

  return { data, error };
}

/**
 * Get children plants (plants that have this plant as parent).
 * Includes legacy plants since parent relationships should persist.
 */
export async function getChildrenPlants(plantId: string, userId: string) {
  "use cache";
  cacheTag(scopedListTag("plant-children", plantId));
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plants")
    .select("id, name, nickname, active_photo_id, is_legacy, created_at")
    .eq("parent_plant_id", plantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

/**
 * Get all plants for a user (for parent selection in dialogs).
 * Includes legacy plants since users may want to track lineage from legacy plants.
 * Returns minimal info for combobox/select usage.
 */
export async function getPlantsForParentSelection(userId: string, excludePlantId?: string) {
  "use cache";
  cacheTag(userTag(userId, "plants"));

  const supabase = createPublicClient();

  let query = supabase
    .from("plants")
    .select("id, name, nickname, is_legacy")
    .eq("user_id", userId)
    .order("is_legacy", { ascending: true }) // Active plants first
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

// ============================================================================
// TAXONOMY QUERIES (for Taxonomy Tree View)
// ============================================================================

export type Taxon = {
  id: string;
  wikidata_qid: string;
  rank: string | null;
  scientific_name: string | null;
  common_name: string | null;
};

export type TaxonEdge = {
  parent_taxon_id: string;
  child_taxon_id: string;
};

export type PlantWithTaxon = {
  id: string;
  name: string;
  nickname: string | null;
  active_photo_id: string | null;
  plant_types: {
    id: string;
    name: string;
    scientific_name: string | null;
    taxon_id: string | null;
  }[] | null;
};

export type TaxonomyTreeNode = {
  taxon: Taxon;
  children: TaxonomyTreeNode[];
  plants: { id: string; name: string; nickname: string | null; active_photo_id: string | null; plantTypeName: string | null }[];
  plantCount: number; // Total plants in this node and all descendants
};

export type TaxonomyTree = {
  roots: TaxonomyTreeNode[];
  totalPlants: number;
  plantsWithoutTaxon: { id: string; name: string; nickname: string | null; active_photo_id: string | null; plantTypeName: string | null }[];
};

/**
 * Get active plants with their taxon data for taxonomy tree.
 */
export async function getPlantsWithTaxon(userId: string): Promise<FetchResult<PlantWithTaxon>> {
  "use cache";
  cacheTag(userTag(userId, "plants"));
  cacheTag(tableTag("plant-types"));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("plants")
    .select(`
      id,
      name,
      nickname,
      active_photo_id,
      plant_types (
        id,
        name,
        scientific_name,
        taxon_id
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("is_legacy", false);

  return { data: data || [], error: error?.message };
}

/**
 * Get all taxa records.
 */
export async function getAllTaxa(): Promise<FetchResult<Taxon>> {
  "use cache";
  cacheTag(tableTag("taxa"));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("taxa")
    .select("id, wikidata_qid, rank, scientific_name, common_name");

  return { data: data || [], error: error?.message };
}

/**
 * Get all taxon edges (parent-child relationships).
 */
export async function getAllTaxonEdges(): Promise<FetchResult<TaxonEdge>> {
  "use cache";
  cacheTag(tableTag("taxon-edges"));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("taxon_edges")
    .select("parent_taxon_id, child_taxon_id");

  return { data: data || [], error: error?.message };
}

/**
 * Build a taxonomy tree from plants, taxa, and edges.
 * Groups plants under their species, then builds upward through genus, family, etc.
 */
export function buildTaxonomyTree(
  plants: PlantWithTaxon[],
  taxa: Taxon[],
  edges: TaxonEdge[]
): TaxonomyTree {
  // Create lookup maps
  const taxaById = new Map<string, Taxon>();
  taxa.forEach(t => taxaById.set(t.id, t));

  // Build parent->children and child->parent maps
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  
  edges.forEach(edge => {
    // child->parent
    parentMap.set(edge.child_taxon_id, edge.parent_taxon_id);
    
    // parent->children
    const children = childrenMap.get(edge.parent_taxon_id) || [];
    children.push(edge.child_taxon_id);
    childrenMap.set(edge.parent_taxon_id, children);
  });

  // Group plants by their taxon_id
  const plantsByTaxonId = new Map<string, PlantWithTaxon[]>();
  const plantsWithoutTaxon: PlantWithTaxon[] = [];

  plants.forEach(plant => {
    const plantType = Array.isArray(plant.plant_types) 
      ? plant.plant_types[0] 
      : plant.plant_types;
    const taxonId = plantType?.taxon_id;

    if (taxonId && taxaById.has(taxonId)) {
      const existing = plantsByTaxonId.get(taxonId) || [];
      existing.push(plant);
      plantsByTaxonId.set(taxonId, existing);
    } else {
      plantsWithoutTaxon.push(plant);
    }
  });

  // Find all taxon IDs that are relevant (have plants or are ancestors of taxa with plants)
  const relevantTaxonIds = new Set<string>();
  
  // Start with taxa that have plants
  plantsByTaxonId.forEach((_, taxonId) => {
    // Add this taxon and all its ancestors
    let currentId: string | undefined = taxonId;
    while (currentId) {
      relevantTaxonIds.add(currentId);
      currentId = parentMap.get(currentId);
    }
  });

  // Build tree nodes recursively
  function buildNode(taxonId: string): TaxonomyTreeNode | null {
    const taxon = taxaById.get(taxonId);
    if (!taxon) return null;

    // Get direct children that are relevant
    const childIds = childrenMap.get(taxonId) || [];
    const childNodes: TaxonomyTreeNode[] = [];
    
    childIds.forEach(childId => {
      if (relevantTaxonIds.has(childId)) {
        const childNode = buildNode(childId);
        if (childNode) {
          childNodes.push(childNode);
        }
      }
    });

    // Sort children by name
    childNodes.sort((a, b) => {
      const nameA = a.taxon.common_name || a.taxon.scientific_name || "";
      const nameB = b.taxon.common_name || b.taxon.scientific_name || "";
      return nameA.localeCompare(nameB);
    });

    // Get plants directly at this taxon level
    const directPlants = (plantsByTaxonId.get(taxonId) || []).map(p => {
      const plantType = Array.isArray(p.plant_types) ? p.plant_types[0] : p.plant_types;
      return {
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        active_photo_id: p.active_photo_id,
        plantTypeName: plantType?.name || null,
      };
    });

    // Calculate total plant count (direct + descendants)
    const descendantCount = childNodes.reduce((sum, child) => sum + child.plantCount, 0);
    const plantCount = directPlants.length + descendantCount;

    return {
      taxon,
      children: childNodes,
      plants: directPlants,
      plantCount,
    };
  }

  // Find root nodes (relevant taxa with no parent or parent not in relevant set)
  const rootIds: string[] = [];
  relevantTaxonIds.forEach(taxonId => {
    const parentId = parentMap.get(taxonId);
    if (!parentId || !relevantTaxonIds.has(parentId)) {
      rootIds.push(taxonId);
    }
  });

  // Build root nodes
  const roots: TaxonomyTreeNode[] = [];
  rootIds.forEach(rootId => {
    const node = buildNode(rootId);
    if (node) {
      roots.push(node);
    }
  });

  // Sort roots by name
  roots.sort((a, b) => {
    const nameA = a.taxon.common_name || a.taxon.scientific_name || "";
    const nameB = b.taxon.common_name || b.taxon.scientific_name || "";
    return nameA.localeCompare(nameB);
  });

  return {
    roots,
    totalPlants: plants.length,
    plantsWithoutTaxon: plantsWithoutTaxon.map(p => {
      const plantType = Array.isArray(p.plant_types) ? p.plant_types[0] : p.plant_types;
      return {
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        active_photo_id: p.active_photo_id,
        plantTypeName: plantType?.name || null,
      };
    }),
  };
}

/**
 * Get complete taxonomy data for a user's plants.
 * Fetches plants, taxa, and edges, then builds the tree.
 */
export async function getTaxonomyForUserPlants(userId: string): Promise<{
  tree: TaxonomyTree;
  error?: string;
}> {
  const [plantsResult, taxaResult, edgesResult] = await Promise.all([
    getPlantsWithTaxon(userId),
    getAllTaxa(),
    getAllTaxonEdges(),
  ]);

  if (plantsResult.error || taxaResult.error || edgesResult.error) {
    return {
      tree: { roots: [], totalPlants: 0, plantsWithoutTaxon: [] },
      error: plantsResult.error || taxaResult.error || edgesResult.error || undefined,
    };
  }

  const tree = buildTaxonomyTree(
    plantsResult.data,
    taxaResult.data,
    edgesResult.data
  );

  return { tree };
}

// ============================================================================
// COMPACTED TAXONOMY TREE (for UI display)
// ============================================================================

/**
 * A compacted tree node that collapses linear chains into a single node.
 * The `path` array contains all taxa in a collapsed chain.
 */
export type CompactedTreeNode = {
  path: Taxon[]; // Taxa in this collapsed chain (first is highest rank, last is lowest)
  children: CompactedTreeNode[];
  plants: { id: string; name: string; nickname: string | null; active_photo_id: string | null; plantTypeName: string | null }[];
  plantCount: number;
  isBranchPoint: boolean; // True if this node has multiple children
  isLeaf: boolean; // True if this node has no children (plants are here)
};

export type CompactedTaxonomyTree = {
  roots: CompactedTreeNode[];
  totalPlants: number;
  plantsWithoutTaxon: { id: string; name: string; nickname: string | null; active_photo_id: string | null; plantTypeName: string | null }[];
};

/**
 * Build a compacted tree from the standard taxonomy tree.
 * Collapses linear chains (single-child paths) into a single node with full path.
 */
export function buildCompactedTree(tree: TaxonomyTree): CompactedTaxonomyTree {
  function compactNode(node: TaxonomyTreeNode, accumulatedPath: Taxon[] = []): CompactedTreeNode {
    const currentPath = [...accumulatedPath, node.taxon];
    
    // Determine if this is a branch point or leaf
    const hasMultipleChildren = node.children.length > 1;
    const hasPlants = node.plants.length > 0;
    const isLeaf = node.children.length === 0;
    const isBranchPoint = hasMultipleChildren;
    
    // If this node has exactly one child and no direct plants, continue collapsing
    if (node.children.length === 1 && !hasPlants) {
      return compactNode(node.children[0], currentPath);
    }
    
    // Otherwise, this is a stopping point - create a compacted node
    const compactedChildren = node.children.map(child => compactNode(child, []));
    
    // Sort children by name
    compactedChildren.sort((a, b) => {
      const nameA = a.path[0]?.common_name || a.path[0]?.scientific_name || "";
      const nameB = b.path[0]?.common_name || b.path[0]?.scientific_name || "";
      return nameA.localeCompare(nameB);
    });
    
    return {
      path: currentPath,
      children: compactedChildren,
      plants: node.plants,
      plantCount: node.plantCount,
      isBranchPoint,
      isLeaf,
    };
  }
  
  const compactedRoots = tree.roots.map(root => compactNode(root, []));
  
  // Sort roots by name
  compactedRoots.sort((a, b) => {
    const nameA = a.path[0]?.common_name || a.path[0]?.scientific_name || "";
    const nameB = b.path[0]?.common_name || b.path[0]?.scientific_name || "";
    return nameA.localeCompare(nameB);
  });
  
  return {
    roots: compactedRoots,
    totalPlants: tree.totalPlants,
    plantsWithoutTaxon: tree.plantsWithoutTaxon,
  };
}
