import { cache } from "react";

import {
  getActiveIssueCountForUser,
  getDueTasksForUser,
  getPlantCountForUser,
  getPlantsForSpotlight,
  getProfileForUser,
  getRecentJournalEntriesForUser,
  getScheduleSuggestionsForUser,
  getWishlistCountForUser,
} from "@/lib/queries/today";

export const getDashboardProfile = cache((userId: string) => getProfileForUser(userId));
export const getDashboardDueTasks = cache((userId: string) => getDueTasksForUser(userId));
export const getDashboardPlantCount = cache((userId: string) => getPlantCountForUser(userId));
export const getDashboardWishlistCount = cache((userId: string) => getWishlistCountForUser(userId));
export const getDashboardJournalEntries = cache((userId: string) =>
  getRecentJournalEntriesForUser(userId)
);
export const getDashboardSpotlightPlants = cache((userId: string) =>
  getPlantsForSpotlight(userId)
);
export const getDashboardActiveIssueCount = cache((userId: string) =>
  getActiveIssueCountForUser(userId)
);
export const getDashboardScheduleSuggestions = cache((userId: string) =>
  getScheduleSuggestionsForUser(userId)
);
