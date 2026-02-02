import { Heart, Leaf } from "lucide-react";
import Link from "next/link";

import {
  getDashboardActiveIssueCount,
  getDashboardPlantCount,
  getDashboardProfile,
  getDashboardWishlistCount,
} from "./today-dashboard-data";
import { getGreeting } from "./today-dashboard-utils";

export async function DashboardHeader({ userId }: { userId: string }) {
  const [
    { data: profile },
    { count: plantCount },
    { count: wishlistCount },
    { count: activeIssueCount },
  ] = await Promise.all([
    getDashboardProfile(userId),
    getDashboardPlantCount(userId),
    getDashboardWishlistCount(userId),
    getDashboardActiveIssueCount(userId),
  ]);

  const hasPlants = plantCount !== null && plantCount > 0;
  const { greeting, subtext } = getGreeting();
  const displayName = profile?.display_name;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          {greeting}
          {displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">{subtext}</p>
      </div>

      {hasPlants && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/plants"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20 transition-colors"
          >
            <Leaf className="h-4 w-4" />
            <span className="font-medium">{plantCount}</span> plant
            {plantCount !== 1 ? "s" : ""}
          </Link>
          {(wishlistCount ?? 0) > 0 && (
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-1 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20 transition-colors"
            >
              <Heart className="h-4 w-4" />
              <span className="font-medium">{wishlistCount}</span> on wishlist
            </Link>
          )}
          {(activeIssueCount ?? 0) > 0 && (
            <Link
              href="/journal?type=issues"
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors"
            >
              <span className="font-medium">{activeIssueCount}</span> active issue
              {activeIssueCount !== 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
