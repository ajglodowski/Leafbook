"use server";

import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/supabase/server";
import {
  getJournalEntriesForUser,
  getUserPlantsForJournal,
  getPlantIssuesForUser,
  type JournalEntryWithPlant,
  type PlantIssueWithPlant,
} from "@/lib/queries/journal";
import { IssueStatus } from "../plants/[plantId]/actions";

/**
 * Get journal entries for the current user.
 * Wrapper that handles auth and calls the cached query.
 */
export async function getJournalEntries(options?: {
  plantId?: string;
  limit?: number;
}): Promise<{ entries: JournalEntryWithPlant[]; error: string | null }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return getJournalEntriesForUser(userId, options);
}

/**
 * Get user's plants for journal filtering.
 * Wrapper that handles auth and calls the cached query.
 */
export async function getUserPlants(): Promise<{
  plants: { id: string; name: string }[];
  error: string | null;
}> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return getUserPlantsForJournal(userId);
}

/**
 * Get plant issues for the current user.
 * Wrapper that handles auth and calls the cached query.
 */
export async function getPlantIssues(options?: {
  plantId?: string;
  status?: IssueStatus;
  limit?: number;
}): Promise<{ issues: PlantIssueWithPlant[]; error: string | null }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return getPlantIssuesForUser(userId, options);
}
