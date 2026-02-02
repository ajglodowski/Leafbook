import { BookOpen, History } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";

import { getTimelineData, getTimelinePlants } from "./actions";
import { TimelineFeed } from "./timeline-feed";
import { type TimelineFeedType, TimelineHeader } from "./timeline-header";

export const metadata = {
  title: "Timeline | Leafbook",
  description: "Review your plant events, issues, and journal notes",
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ plant?: string; type?: string; event?: string }>;
}) {
  const { plant: plantFilter, type: typeFilter, event: eventFilter } = await searchParams;

  const feedType: TimelineFeedType =
    typeFilter === "events" ? "events" :
    typeFilter === "journal" ? "journal" :
    typeFilter === "issues" ? "issues" :
    "all";

  const [{ events, issues, entries }, { plants }] = await Promise.all([
    getTimelineData({
      plantId: plantFilter,
      eventType: feedType === "events" ? eventFilter : undefined,
    }),
    getTimelinePlants(),
  ]);

  const filteredEvents =
    eventFilter && (feedType === "events" || feedType === "all")
      ? events.filter((eventItem) => eventItem.event_type === eventFilter)
      : events;

  const visibleEvents = feedType === "events" || feedType === "all" ? filteredEvents : [];
  const visibleEntries = feedType === "journal" || feedType === "all" ? entries : [];
  const visibleIssues = feedType === "issues" || feedType === "all" ? issues : [];

  const hasPlants = plants.length > 0;
  const hasContent = visibleEvents.length > 0 || visibleEntries.length > 0 || visibleIssues.length > 0;

  if (!hasContent) {
    return (
      <div className="space-y-8">
        <TimelineHeader
          plants={plants}
          selectedPlantId={plantFilter}
          selectedFeedType={feedType}
          selectedEventType={eventFilter}
        />
        <EmptyState
          icon={hasPlants ? History : BookOpen}
          title={hasPlants ? "No timeline activity yet" : "Add a plant first"}
          description={
            hasPlants
              ? "Log care, track issues, or write a journal note to start the story."
              : "Add some plants to your collection, then you can start building their timeline."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TimelineHeader
        plants={plants}
        selectedPlantId={plantFilter}
        selectedFeedType={feedType}
        selectedEventType={eventFilter}
      />
      <TimelineFeed
        events={visibleEvents}
        entries={visibleEntries}
        issues={visibleIssues}
      />
    </div>
  );
}
