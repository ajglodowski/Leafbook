import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";

import { getJournalEntries, getUserPlants } from "./actions";
import { JournalFeed } from "./journal-feed";
import { JournalHeader } from "./journal-header";

export const metadata = {
  title: "Journal | Leafbook",
  description: "Review your plant journal and issues",
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ plant?: string }>;
}) {
  const { plant: plantFilter } = await searchParams;

  const [{ entries }, { plants }] = await Promise.all([
    getJournalEntries({ plantId: plantFilter }),
    getUserPlants(),
  ]);

  // If user has no plants at all, show a different empty state
  const hasPlants = plants.length > 0;
  const hasContent = entries.length > 0;

  const getEmptyStateProps = () => {
    if (!hasPlants) {
      return {
        icon: BookOpen,
        title: "Add a plant first",
        description: "Add some plants to your collection, then you can start journaling about them.",
      };
    }

    if (plantFilter) {
      return {
        icon: BookOpen,
        title: "No journal entries for this plant",
        description: "Write about this plant from its detail page to start its story.",
      };
    }

    return {
      icon: BookOpen,
      title: "No journal entries yet",
      description: "Write about your plants — milestones, observations, or just how they make you feel.",
    };
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <JournalHeader
        plants={plants}
        selectedPlantId={plantFilter}
      />

      {/* Content */}
      {hasContent ? (
        <JournalFeed entries={entries} />
      ) : (
        <EmptyState {...getEmptyStateProps()} />
      )}
    </div>
  );
}
