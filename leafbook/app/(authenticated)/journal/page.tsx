import { BookOpen, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getJournalEntries, getPlantIssues, getUserPlants } from "./actions";
import { JournalFeed } from "./journal-feed";
import { JournalHeader, type FeedType } from "./journal-header";

export const metadata = {
  title: "Journal | Leafbook",
  description: "Review your plant journal and issues",
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ plant?: string; type?: string }>;
}) {
  const { plant: plantFilter, type: typeFilter } = await searchParams;
  
  // Validate type filter
  const feedType: FeedType = 
    typeFilter === "journal" ? "journal" :
    typeFilter === "issues" ? "issues" :
    "all";

  const [{ entries }, { issues }, { plants }] = await Promise.all([
    // Only fetch journal entries if showing all or journal
    feedType !== "issues"
      ? getJournalEntries({ plantId: plantFilter })
      : Promise.resolve({ entries: [], error: null }),
    // Only fetch issues if showing all or issues
    feedType !== "journal"
      ? getPlantIssues({ plantId: plantFilter, status: "all" })
      : Promise.resolve({ issues: [], error: null }),
    getUserPlants(),
  ]);

  // If user has no plants at all, show a different empty state
  const hasPlants = plants.length > 0;
  const hasContent = entries.length > 0 || issues.length > 0;

  const getEmptyStateProps = () => {
    if (!hasPlants) {
      return {
        icon: BookOpen,
        title: "Add a plant first",
        description: "Add some plants to your collection, then you can start journaling about them.",
      };
    }

    if (plantFilter) {
      if (feedType === "journal") {
        return {
          icon: BookOpen,
          title: "No journal entries for this plant",
          description: "Write about this plant from its detail page to start its story.",
        };
      }
      if (feedType === "issues") {
        return {
          icon: AlertTriangle,
          title: "No issues for this plant",
          description: "When you notice a problem with this plant, you can report it from the plant's detail page.",
        };
      }
      return {
        icon: BookOpen,
        title: "Nothing here yet for this plant",
        description: "Write journal entries or report issues from this plant's detail page.",
      };
    }

    if (feedType === "journal") {
      return {
        icon: BookOpen,
        title: "No journal entries yet",
        description: "Write about your plants — milestones, observations, or just how they make you feel.",
      };
    }
    if (feedType === "issues") {
      return {
        icon: AlertTriangle,
        title: "No issues reported",
        description: "When you notice problems with your plants, you can track them here.",
      };
    }
    return {
      icon: BookOpen,
      title: "Nothing here yet",
      description: "Write journal entries or report issues from any plant's detail page.",
    };
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <JournalHeader
        plants={plants}
        selectedPlantId={plantFilter}
        selectedFeedType={feedType}
        hasContent={hasContent}
      />

      {/* Content */}
      {hasContent ? (
        <JournalFeed entries={entries} issues={issues} />
      ) : (
        <EmptyState {...getEmptyStateProps()} />
      )}
    </div>
  );
}
