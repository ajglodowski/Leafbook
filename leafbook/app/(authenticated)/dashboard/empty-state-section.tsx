import { CalendarCheck, Compass, Plus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

import { getDashboardPlantCount } from "./today-dashboard-data";

export async function EmptyStateSection({ userId }: { userId: string }) {
  const { count: plantCount } = await getDashboardPlantCount(userId);
  const hasPlants = plantCount !== null && plantCount > 0;

  if (hasPlants) {
    return null;
  }

  return (
    <EmptyState
      icon={CalendarCheck}
      title="Welcome to your plant journal"
      description="Add your first plant to start your collection. Track care with one tap, write journal entries, and build a story for every leaf."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/plants">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add your first plant
          </Button>
        </Link>
        <Link href="/plant-types">
          <Button variant="outline">
            <Compass className="mr-2 h-4 w-4" />
            Browse catalog
          </Button>
        </Link>
      </div>
    </EmptyState>
  );
}
