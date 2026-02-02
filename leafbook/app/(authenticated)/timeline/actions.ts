"use server";

import { redirect } from "next/navigation";

import { getUserPlantsForJournal } from "@/lib/queries/journal";
import {
  getTimelineEventsForUser,
  getTimelineIssuesForUser,
  getTimelineJournalEntriesForUser,
  type TimelineEvent,
  type TimelineIssue,
  type TimelineJournalEntry,
} from "@/lib/queries/timeline";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function getTimelineData(options?: {
  plantId?: string;
  eventType?: string;
  limit?: number;
}): Promise<{
  events: TimelineEvent[];
  issues: TimelineIssue[];
  entries: TimelineJournalEntry[];
  error: string | null;
}> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const [{ events, error: eventsError }, { issues, error: issuesError }, { entries, error: entriesError }] =
    await Promise.all([
      getTimelineEventsForUser(userId, options),
      getTimelineIssuesForUser(userId, options),
      getTimelineJournalEntriesForUser(userId, options),
    ]);

  const error = eventsError || issuesError || entriesError || null;

  return { events, issues, entries, error };
}

export async function getTimelinePlants() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return getUserPlantsForJournal(userId);
}
