import { cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { userTag } from "@/lib/cache-tags";

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
        description
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}
