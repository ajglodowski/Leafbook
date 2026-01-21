/**
 * Cache tag utilities for Next.js 19 tagged caching with Supabase.
 *
 * Use these helpers to generate consistent cache tags for reads (cacheTag)
 * and invalidation (revalidateTag).
 */

// ============================================================================
// Tag Generators
// ============================================================================

/**
 * Generate a user-scoped tag for list queries.
 * Example: userTag("abc123", "plants") => "user:abc123:plants"
 */
export function userTag(
  userId: string,
  scope:
    | "plants"
    | "wishlist"
    | "journal"
    | "issues"
    | "due-tasks"
    | "pots"
    | "schedule-suggestions"
    | "profile"
): string {
  return `user:${userId}:${scope}`;
}

/**
 * Generate a record-level tag for a specific entity.
 * Example: recordTag("plant", "xyz789") => "plant:xyz789"
 */
export function recordTag(
  entity:
    | "plant"
    | "plant-type"
    | "plant-type-photo"
    | "wishlist-item"
    | "journal-entry"
    | "plant-issue"
    | "pot"
    | "schedule-suggestion"
    | "profile"
    | "plant-photo"
    | "plant-event"
    | "care-preferences",
  id: string
): string {
  return `${entity}:${id}`;
}

/**
 * Generate a table-level tag for global/shared data.
 * Example: tableTag("plant-types") => "plant-types"
 */
export function tableTag(
  entity: "plant-types" | "plant-type-photos" | "plant-type-origins"
): string {
  return entity;
}

/**
 * Generate a scoped list tag for a parent entity.
 * Example: scopedListTag("plant-type-photos", "abc") => "plant-type-photos:abc"
 */
export function scopedListTag(
  entity: "plant-type-photos" | "plant-photos" | "plant-events" | "journal-entries" | "plant-issues" | "plant-children",
  parentId: string
): string {
  return `${entity}:${parentId}`;
}

// ============================================================================
// Tag Collections for Common Operations
// ============================================================================

/**
 * Tags to set when reading a user's plants list.
 */
export function plantListTags(userId: string, plantIds: string[]): string[] {
  return [
    userTag(userId, "plants"),
    ...plantIds.map((id) => recordTag("plant", id)),
  ];
}

/**
 * Tags to set when reading a single plant detail.
 */
export function plantDetailTags(userId: string, plantId: string): string[] {
  return [recordTag("plant", plantId), userTag(userId, "plants")];
}

/**
 * Tags to invalidate when a plant is created/updated/deleted.
 */
export function plantMutationTags(userId: string, plantId: string): string[] {
  return [
    recordTag("plant", plantId),
    userTag(userId, "plants"),
    userTag(userId, "due-tasks"),
  ];
}

/**
 * Tags to set when reading plant types list.
 */
export function plantTypeListTags(plantTypeIds: string[]): string[] {
  return [
    tableTag("plant-types"),
    ...plantTypeIds.map((id) => recordTag("plant-type", id)),
  ];
}

/**
 * Tags to set when reading a single plant type.
 */
export function plantTypeDetailTags(plantTypeId: string): string[] {
  return [recordTag("plant-type", plantTypeId), tableTag("plant-types")];
}

/**
 * Tags to invalidate when a plant type is created/updated/deleted.
 */
export function plantTypeMutationTags(plantTypeId: string): string[] {
  return [recordTag("plant-type", plantTypeId), tableTag("plant-types")];
}

/**
 * Tags to set when reading a user's wishlist.
 */
export function wishlistTags(
  userId: string,
  itemIds: string[],
  plantTypeIds: string[]
): string[] {
  return [
    userTag(userId, "wishlist"),
    ...itemIds.map((id) => recordTag("wishlist-item", id)),
    ...plantTypeIds.filter(Boolean).map((id) => recordTag("plant-type", id)),
  ];
}

/**
 * Tags to invalidate when a wishlist item is added/removed.
 */
export function wishlistMutationTags(
  userId: string,
  itemId: string,
  plantTypeId?: string | null
): string[] {
  const tags = [recordTag("wishlist-item", itemId), userTag(userId, "wishlist")];
  if (plantTypeId) {
    tags.push(recordTag("plant-type", plantTypeId));
  }
  return tags;
}

/**
 * Tags to set when reading journal entries.
 */
export function journalTags(
  userId: string,
  entryIds: string[],
  plantIds: string[]
): string[] {
  return [
    userTag(userId, "journal"),
    ...entryIds.map((id) => recordTag("journal-entry", id)),
    ...plantIds.map((id) => recordTag("plant", id)),
  ];
}

/**
 * Tags to invalidate when a journal entry is created/updated/deleted.
 */
export function journalMutationTags(
  userId: string,
  entryId: string,
  plantId: string
): string[] {
  return [
    recordTag("journal-entry", entryId),
    userTag(userId, "journal"),
    recordTag("plant", plantId),
    scopedListTag("journal-entries", plantId),
  ];
}

/**
 * Tags to set when reading plant issues.
 */
export function issueTags(
  userId: string,
  issueIds: string[],
  plantIds: string[]
): string[] {
  return [
    userTag(userId, "issues"),
    ...issueIds.map((id) => recordTag("plant-issue", id)),
    ...plantIds.map((id) => recordTag("plant", id)),
  ];
}

/**
 * Tags to invalidate when a plant issue is created/updated/deleted.
 */
export function issueMutationTags(
  userId: string,
  issueId: string,
  plantId: string
): string[] {
  return [
    recordTag("plant-issue", issueId),
    userTag(userId, "issues"),
    recordTag("plant", plantId),
    scopedListTag("plant-issues", plantId),
  ];
}

/**
 * Tags to set when reading user's pots.
 */
export function potsTags(userId: string, potIds: string[]): string[] {
  return [
    userTag(userId, "pots"),
    ...potIds.map((id) => recordTag("pot", id)),
  ];
}

/**
 * Tags to invalidate when a pot is created/updated/deleted.
 */
export function potMutationTags(userId: string, potId: string): string[] {
  return [recordTag("pot", potId), userTag(userId, "pots")];
}

/**
 * Tags to set when reading due tasks view.
 */
export function dueTasksTags(userId: string, plantIds: string[]): string[] {
  return [
    userTag(userId, "due-tasks"),
    ...plantIds.map((id) => recordTag("plant", id)),
  ];
}

/**
 * Tags to invalidate when a care event is logged.
 */
export function careEventMutationTags(userId: string, plantId: string): string[] {
  return [
    recordTag("plant", plantId),
    userTag(userId, "due-tasks"),
    userTag(userId, "plants"),
    scopedListTag("plant-events", plantId),
  ];
}

/**
 * Tags to set when reading schedule suggestions.
 */
export function scheduleSuggestionsTags(
  userId: string,
  suggestionIds: string[],
  plantIds: string[]
): string[] {
  return [
    userTag(userId, "schedule-suggestions"),
    ...suggestionIds.map((id) => recordTag("schedule-suggestion", id)),
    ...plantIds.map((id) => recordTag("plant", id)),
  ];
}

/**
 * Tags to invalidate when a schedule suggestion is accepted/dismissed.
 */
export function scheduleSuggestionMutationTags(
  userId: string,
  suggestionId: string,
  plantId: string
): string[] {
  return [
    recordTag("schedule-suggestion", suggestionId),
    userTag(userId, "schedule-suggestions"),
    recordTag("plant", plantId),
    userTag(userId, "due-tasks"),
  ];
}

/**
 * Tags for plant photos.
 */
export function plantPhotosTags(plantId: string, photoIds: string[]): string[] {
  return [
    scopedListTag("plant-photos", plantId),
    ...photoIds.map((id) => recordTag("plant-photo", id)),
  ];
}

/**
 * Tags to invalidate when a plant photo is added/removed.
 */
export function plantPhotoMutationTags(plantId: string, photoId: string): string[] {
  return [
    recordTag("plant-photo", photoId),
    scopedListTag("plant-photos", plantId),
    recordTag("plant", plantId),
  ];
}

/**
 * Tags for plant type photos.
 */
export function plantTypePhotosTags(
  plantTypeId: string,
  photoIds: string[]
): string[] {
  return [
    scopedListTag("plant-type-photos", plantTypeId),
    tableTag("plant-type-photos"),
    ...photoIds.map((id) => recordTag("plant-type-photo", id)),
  ];
}

/**
 * Tags to invalidate when a plant type photo is added/removed.
 */
export function plantTypePhotoMutationTags(
  plantTypeId: string,
  photoId: string
): string[] {
  return [
    recordTag("plant-type-photo", photoId),
    scopedListTag("plant-type-photos", plantTypeId),
    recordTag("plant-type", plantTypeId),
    tableTag("plant-type-photos"),
  ];
}

/**
 * Tags for care preferences.
 */
export function carePreferencesTags(plantId: string): string[] {
  return [recordTag("care-preferences", plantId), recordTag("plant", plantId)];
}

/**
 * Tags to invalidate when care preferences are updated.
 */
export function carePreferencesMutationTags(
  userId: string,
  plantId: string
): string[] {
  return [
    recordTag("care-preferences", plantId),
    recordTag("plant", plantId),
    userTag(userId, "due-tasks"),
  ];
}

/**
 * Tags for profile.
 */
export function profileTags(userId: string): string[] {
  return [recordTag("profile", userId), userTag(userId, "profile")];
}

/**
 * Tags to invalidate when a plant's parent is set/unset (propagation).
 */
export function propagationMutationTags(
  userId: string,
  childPlantId: string,
  parentPlantId?: string | null
): string[] {
  const tags = [
    recordTag("plant", childPlantId),
    userTag(userId, "plants"),
    scopedListTag("plant-events", childPlantId),
  ];
  if (parentPlantId) {
    tags.push(recordTag("plant", parentPlantId));
    tags.push(scopedListTag("plant-children", parentPlantId));
    tags.push(scopedListTag("plant-events", parentPlantId));
  }
  return tags;
}
