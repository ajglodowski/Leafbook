import { cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import {
  plantTypeDetailTags,
  recordTag,
  scopedListTag,
  tableTag,
  userTag,
} from "@/lib/cache-tags";

/**
 * Get all plant types with optional filtering.
 * Used by plant-types catalog page.
 */
export async function getPlantTypesWithPhotos(filters?: {
  q?: string;
  lightNumeric?: number;
  sizeNumeric?: number;
}) {
  "use cache";
  cacheTag(tableTag("plant-types"));
  cacheTag(tableTag("plant-type-photos"));

  const supabase = createPublicClient();

  let query = supabase
    .from("plant_types")
    .select(`
      *,
      plant_type_photos!left (
        id,
        url,
        is_primary
      )
    `)
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

  const { data, error } = await query;

  return { data, error };
}

/**
 * Get a single plant type by ID.
 */
export async function getPlantTypeById(plantTypeId: string) {
  "use cache";
  cacheTag(...plantTypeDetailTags(plantTypeId));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("plant_types")
    .select("*")
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
