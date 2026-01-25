import { cacheTag } from "next/cache";

import { userTag } from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Get user's wishlist items with plant type info.
 */
export async function getWishlistItemsForUserById(userId: string) {
  "use cache";
  cacheTag(userTag(userId, "wishlist"));

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("wishlist_items")
    .select(`
      id,
      notes,
      priority,
      created_at,
      custom_name,
      plant_type_id,
      plant_types (
        id,
        name,
        scientific_name,
        description,
        plant_type_photos (
          id,
          url,
          is_primary
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}
