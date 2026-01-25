import { cacheTag } from "next/cache";

import {
  plantTypeDetailTags,
  recordTag,
  scopedListTag,
  tableTag,
  userTag,
} from "@/lib/cache-tags";
import type { Taxon, TaxonEdge } from "@/lib/queries/plants";
import { getAllTaxa, getAllTaxonEdges } from "@/lib/queries/plants";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Get all plant types with optional filtering.
 * Used by plant-types catalog page.
 */
export async function getPlantTypesWithPhotos(filters?: {
  q?: string;
  lightNumeric?: number;
  sizeNumeric?: number;
  page?: number;
  pageSize?: number;
}) {
  "use cache";
  cacheTag(tableTag("plant-types"));
  cacheTag(tableTag("plant-type-photos"));

  const supabase = createPublicClient();

  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.max(1, filters?.pageSize ?? 24);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("plant_types")
    .select(`
      *,
      plant_type_photos!left (
        id,
        url,
        is_primary
      )
    `, { count: "exact" })
    .order("name");

  // Apply search filter
  if (filters?.q) {
    query = query.or(
      `name.ilike.%${filters.q}%,scientific_name.ilike.%${filters.q}%,description.ilike.%${filters.q}%`
    );
  }

  // Apply light filter
  if (filters?.lightNumeric) {
    query = query
      .lte("light_min_numeric", filters.lightNumeric)
      .gte("light_max_numeric", filters.lightNumeric);
  }

  // Apply size filter
  if (filters?.sizeNumeric) {
    query = query
      .lte("size_min_numeric", filters.sizeNumeric)
      .gte("size_max_numeric", filters.sizeNumeric);
  }

  const { data, error, count } = await query.range(from, to);

  return { data, error, count };
}

interface FetchResult<T> {
  data: T[];
  error?: string | null;
}

export type PlantTypeTaxonomyEntry = {
  id: string;
  name: string;
  scientific_name: string | null;
  taxon_id: string | null;
  primary_photo_url?: string | null;
};

export type PlantTypeTaxonomyTreeNode = {
  taxon: Taxon;
  children: PlantTypeTaxonomyTreeNode[];
  plantTypes: PlantTypeTaxonomyEntry[];
  plantCount: number;
};

export type PlantTypeTaxonomyTree = {
  roots: PlantTypeTaxonomyTreeNode[];
  totalPlantTypes: number;
  plantTypesWithoutTaxon: PlantTypeTaxonomyEntry[];
};

export type CompactedPlantTypeTreeNode = {
  path: Taxon[];
  children: CompactedPlantTypeTreeNode[];
  plantTypes: PlantTypeTaxonomyEntry[];
  plantCount: number;
  isBranchPoint: boolean;
  isLeaf: boolean;
};

export type CompactedPlantTypeTaxonomyTree = {
  roots: CompactedPlantTypeTreeNode[];
  totalPlantTypes: number;
  plantTypesWithoutTaxon: PlantTypeTaxonomyEntry[];
};

export async function getPlantTypesWithTaxon(): Promise<FetchResult<PlantTypeTaxonomyEntry>> {
  "use cache";
  cacheTag(tableTag("plant-types"));
  cacheTag(tableTag("plant-type-photos"));

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("plant_types")
    .select(`
      id,
      name,
      scientific_name,
      taxon_id,
      plant_type_photos!left (
        id,
        url,
        is_primary
      )
    `)
    .order("name");

  const normalized = (data || []).map((plantType) => {
    const photos = plantType.plant_type_photos || [];
    const primaryPhoto =
      photos.find((photo) => photo.is_primary) || photos[0];

    return {
      id: plantType.id,
      name: plantType.name,
      scientific_name: plantType.scientific_name,
      taxon_id: plantType.taxon_id,
      primary_photo_url: primaryPhoto?.url || null,
    };
  });

  return { data: normalized, error: error?.message };
}

function buildPlantTypeTaxonomyTree(
  plantTypes: PlantTypeTaxonomyEntry[],
  taxa: Taxon[],
  edges: TaxonEdge[]
): PlantTypeTaxonomyTree {
  const taxaById = new Map<string, Taxon>();
  taxa.forEach((taxon) => taxaById.set(taxon.id, taxon));

  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  edges.forEach((edge) => {
    parentMap.set(edge.child_taxon_id, edge.parent_taxon_id);
    const children = childrenMap.get(edge.parent_taxon_id) || [];
    children.push(edge.child_taxon_id);
    childrenMap.set(edge.parent_taxon_id, children);
  });

  const plantTypesByTaxonId = new Map<string, PlantTypeTaxonomyEntry[]>();
  const plantTypesWithoutTaxon: PlantTypeTaxonomyEntry[] = [];

  plantTypes.forEach((plantType) => {
    if (plantType.taxon_id && taxaById.has(plantType.taxon_id)) {
      const existing = plantTypesByTaxonId.get(plantType.taxon_id) || [];
      existing.push(plantType);
      plantTypesByTaxonId.set(plantType.taxon_id, existing);
    } else {
      plantTypesWithoutTaxon.push(plantType);
    }
  });

  const relevantTaxonIds = new Set<string>();
  plantTypesByTaxonId.forEach((_, taxonId) => {
    let currentId: string | undefined = taxonId;
    while (currentId) {
      relevantTaxonIds.add(currentId);
      currentId = parentMap.get(currentId);
    }
  });

  function buildNode(taxonId: string): PlantTypeTaxonomyTreeNode | null {
    const taxon = taxaById.get(taxonId);
    if (!taxon) return null;

    const childIds = childrenMap.get(taxonId) || [];
    const childNodes: PlantTypeTaxonomyTreeNode[] = [];

    childIds.forEach((childId) => {
      if (relevantTaxonIds.has(childId)) {
        const childNode = buildNode(childId);
        if (childNode) {
          childNodes.push(childNode);
        }
      }
    });

    childNodes.sort((a, b) => {
      const nameA = a.taxon.common_name || a.taxon.scientific_name || "";
      const nameB = b.taxon.common_name || b.taxon.scientific_name || "";
      return nameA.localeCompare(nameB);
    });

    const directPlantTypes = (plantTypesByTaxonId.get(taxonId) || []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const descendantCount = childNodes.reduce((sum, child) => sum + child.plantCount, 0);
    const plantCount = directPlantTypes.length + descendantCount;

    return {
      taxon,
      children: childNodes,
      plantTypes: directPlantTypes,
      plantCount,
    };
  }

  const rootIds: string[] = [];
  relevantTaxonIds.forEach((taxonId) => {
    const parentId = parentMap.get(taxonId);
    if (!parentId || !relevantTaxonIds.has(parentId)) {
      rootIds.push(taxonId);
    }
  });

  const roots: PlantTypeTaxonomyTreeNode[] = [];
  rootIds.forEach((rootId) => {
    const node = buildNode(rootId);
    if (node) {
      roots.push(node);
    }
  });

  roots.sort((a, b) => {
    const nameA = a.taxon.common_name || a.taxon.scientific_name || "";
    const nameB = b.taxon.common_name || b.taxon.scientific_name || "";
    return nameA.localeCompare(nameB);
  });

  return {
    roots,
    totalPlantTypes: plantTypes.length,
    plantTypesWithoutTaxon: plantTypesWithoutTaxon.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getTaxonomyForPlantTypes(): Promise<{
  tree: PlantTypeTaxonomyTree;
  error?: string;
}> {
  const [plantTypesResult, taxaResult, edgesResult] = await Promise.all([
    getPlantTypesWithTaxon(),
    getAllTaxa(),
    getAllTaxonEdges(),
  ]);

  if (plantTypesResult.error || taxaResult.error || edgesResult.error) {
    return {
      tree: { roots: [], totalPlantTypes: 0, plantTypesWithoutTaxon: [] },
      error: plantTypesResult.error || taxaResult.error || edgesResult.error || undefined,
    };
  }

  const tree = buildPlantTypeTaxonomyTree(
    plantTypesResult.data,
    taxaResult.data,
    edgesResult.data
  );

  return { tree };
}

export function buildCompactedPlantTypeTree(
  tree: PlantTypeTaxonomyTree
): CompactedPlantTypeTaxonomyTree {
  function compactNode(
    node: PlantTypeTaxonomyTreeNode,
    accumulatedPath: Taxon[] = []
  ): CompactedPlantTypeTreeNode {
    const currentPath = [...accumulatedPath, node.taxon];
    const hasMultipleChildren = node.children.length > 1;
    const hasPlantTypes = node.plantTypes.length > 0;
    const isLeaf = node.children.length === 0;
    const isBranchPoint = hasMultipleChildren;

    if (node.children.length === 1 && !hasPlantTypes) {
      return compactNode(node.children[0], currentPath);
    }

    const compactedChildren = node.children.map((child) => compactNode(child, []));
    compactedChildren.sort((a, b) => {
      const nameA = a.path[0]?.common_name || a.path[0]?.scientific_name || "";
      const nameB = b.path[0]?.common_name || b.path[0]?.scientific_name || "";
      return nameA.localeCompare(nameB);
    });

    return {
      path: currentPath,
      children: compactedChildren,
      plantTypes: node.plantTypes,
      plantCount: node.plantCount,
      isBranchPoint,
      isLeaf,
    };
  }

  const compactedRoots = tree.roots.map((root) => compactNode(root, []));
  compactedRoots.sort((a, b) => {
    const nameA = a.path[0]?.common_name || a.path[0]?.scientific_name || "";
    const nameB = b.path[0]?.common_name || b.path[0]?.scientific_name || "";
    return nameA.localeCompare(nameB);
  });

  return {
    roots: compactedRoots,
    totalPlantTypes: tree.totalPlantTypes,
    plantTypesWithoutTaxon: tree.plantTypesWithoutTaxon,
  };
}

/**
 * Get a single plant type by ID.
 */
export async function getPlantTypeById(plantTypeId: string) {
  "use cache";
  cacheTag(...plantTypeDetailTags(plantTypeId));
  cacheTag(tableTag("plant-type-origins"));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_types")
    .select(`
      *,
      plant_type_origins (
        country_code,
        region
      )
    `)
    .eq("id", plantTypeId)
    .single();

  return { data, error };
}

/**
 * Get photos for a plant type.
 */
export async function getPlantTypePhotos(plantTypeId: string) {
  "use cache";
  cacheTag(scopedListTag("plant-type-photos", plantTypeId));
  cacheTag(recordTag("plant-type", plantTypeId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_type_photos")
    .select("*")
    .eq("plant_type_id", plantTypeId)
    .order("is_primary", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return { data, error };
}

/**
 * Check if a user has a plant type in their wishlist.
 */
export async function getWishlistItemForPlantType(
  userId: string,
  plantTypeId: string
) {
  "use cache";
  cacheTag(userTag(userId, "wishlist"));
  cacheTag(recordTag("plant-type", plantTypeId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", userId)
    .eq("plant_type_id", plantTypeId)
    .single();

  return { data, error };
}

/**
 * Get user's plants of a specific plant type.
 */
export async function getUserPlantsOfType(userId: string, plantTypeId: string) {
  "use cache";
  cacheTag(userTag(userId, "plants"));
  cacheTag(recordTag("plant-type", plantTypeId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plants")
    .select("id, name")
    .eq("user_id", userId)
    .eq("plant_type_id", plantTypeId)
    .eq("is_active", true);

  return { data, error };
}

/**
 * Get all plant types for admin list.
 */
export async function getPlantTypesForAdmin() {
  "use cache";
  cacheTag(tableTag("plant-types"));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_types")
    .select("*")
    .order("name");

  return { data, error };
}
