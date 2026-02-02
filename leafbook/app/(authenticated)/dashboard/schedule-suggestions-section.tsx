import { ScheduleSuggestionBanner } from "@/app/(authenticated)/dashboard/schedule-suggestion-banner";

import { getDashboardScheduleSuggestions } from "./today-dashboard-data";

export async function ScheduleSuggestionsSection({ userId }: { userId: string }) {
  const { data: scheduleSuggestions } = await getDashboardScheduleSuggestions(userId);
  const transformedSuggestions = (scheduleSuggestions || []).map((s) => {
    const plant = Array.isArray(s.plants) ? s.plants[0] : s.plants;
    return {
      id: s.id,
      plant_id: s.plant_id,
      plant_name: plant?.name || "Unknown",
      suggested_interval_days: s.suggested_interval_days,
      current_interval_days: s.current_interval_days,
      confidence_score: s.confidence_score,
    };
  });

  if (transformedSuggestions.length === 0) {
    return null;
  }

  return <ScheduleSuggestionBanner suggestions={transformedSuggestions} />;
}
