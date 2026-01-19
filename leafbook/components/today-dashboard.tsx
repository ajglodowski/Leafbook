import Link from "next/link";
import Image from "next/image";
import {
  CalendarCheck,
  Droplets,
  Sparkles,
  Check,
  Leaf,
  BookOpen,
  Heart,
  Plus,
  Compass,
  PenLine,
  Camera,
  Sprout,
  Clock,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CareButton } from "@/app/(authenticated)/today/care-button";
import { ScheduleSuggestionBanner } from "@/components/schedule-suggestion-banner";
import {
  getActiveIssueCountForUser,
  getDueTasksForUser,
  getPlantCountForUser,
  getPlantsForSpotlight,
  getProfileForUser,
  getRecentJournalEntriesForUser,
  getScheduleSuggestionsForUser,
  getWishlistCountForUser,
} from "@/app/(authenticated)/today/actions";

type TaskStatus = "overdue" | "due_soon" | "not_started" | "ok";

interface PlantTask {
  plant_id: string;
  plant_name: string;
  plant_type_name: string | null;
  watering_status: TaskStatus;
  watering_frequency_days: number;
  last_watered_at: string | null;
  water_due_at: string | null;
  fertilizing_status: TaskStatus;
  fertilizing_frequency_days: number;
  last_fertilized_at: string | null;
  fertilize_due_at: string | null;
}

interface UpcomingTask extends PlantTask {
  days_until_water: number;
}

interface SpotlightPlant {
  id: string;
  name: string;
  nickname: string | null;
  description: string | null;
  how_acquired: string | null;
  plant_type_name: string | null;
  photo_url: string | null;
}

interface RecentJournalEntry {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  plant_id: string;
  plant_name: string;
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? "s" : ""} ago`;
}

function formatJournalDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getGreeting(): { greeting: string; subtext: string } {
  const hour = new Date().getHours();
  
  if (hour < 6) {
    return { greeting: "Burning the midnight oil?", subtext: "Your plants are sleeping soundly." };
  } else if (hour < 12) {
    return { greeting: "Good morning", subtext: "A new day to watch things grow." };
  } else if (hour < 17) {
    return { greeting: "Good afternoon", subtext: "Perfect light for a quick check-in." };
  } else if (hour < 21) {
    return { greeting: "Good evening", subtext: "Time to unwind with your leafy friends." };
  } else {
    return { greeting: "Evening", subtext: "The plants are winding down too." };
  }
}

function getSpotlightMessage(plant: SpotlightPlant): string {
  const messages = [
    `How's ${plant.name} doing today?`,
    `${plant.name} could use some attention`,
    `Check in on ${plant.name}`,
    `${plant.name} is waiting for you`,
    `Time for a moment with ${plant.name}?`,
  ];
  // Use plant id to get consistent message per plant
  const index = plant.id.charCodeAt(0) % messages.length;
  return messages[index];
}

export async function TodayDashboard({ userId }: { userId: string }) {
  if (!userId) {
    return null;
  }
  const start = Date.now();

  // Fetch all data in parallel
  const [
    { data: profile },
    { data: dueTasks, error: dueTasksError },
    { count: plantCount },
    { count: wishlistCount },
    { data: journalEntries },
    { data: plantsForSpotlight },
    { count: activeIssueCount },
    { data: scheduleSuggestions },
  ] = await Promise.all([
    getProfileForUser(userId),
    getDueTasksForUser(userId),
    getPlantCountForUser(userId),
    getWishlistCountForUser(userId),
    getRecentJournalEntriesForUser(userId),
    getPlantsForSpotlight(userId),
    getActiveIssueCountForUser(userId),
    getScheduleSuggestionsForUser(userId),
  ]);
  if (dueTasksError) {
    console.error("Error fetching due tasks:", dueTasksError);
  }

  // Transform schedule suggestions for the banner
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

  // Pick a random plant for spotlight
  const spotlightPlant: SpotlightPlant | null = plantsForSpotlight && plantsForSpotlight.length > 0
    ? (() => {
        // Use current date to get a "random" but consistent plant for the day
        const dayIndex = new Date().getDate() % plantsForSpotlight.length;
        const plant = plantsForSpotlight[dayIndex];
        const plantType = Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types;
        const photos = plant.plant_photos as { url: string }[] | null;
        return {
          id: plant.id,
          name: plant.name,
          nickname: plant.nickname,
          description: plant.description,
          how_acquired: plant.how_acquired,
          plant_type_name: plantType?.name || null,
          photo_url: photos && photos.length > 0 ? photos[0].url : null,
        };
      })()
    : null;

  // Transform journal entries
  const recentJournal: RecentJournalEntry[] = (journalEntries || []).map((entry) => {
    const plant = Array.isArray(entry.plants) ? entry.plants[0] : entry.plants;
    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      entry_date: entry.entry_date,
      plant_id: entry.plant_id,
      plant_name: plant?.name || "Unknown",
    };
  });

  // Helper to calculate days until due
  function getDaysUntilDue(dueDate: string | null): number {
    if (!dueDate) return Infinity;
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Separate tasks into categories
  const needsWater = dueTasks?.filter(
    (t: PlantTask) =>
      t.watering_status === "overdue" ||
      t.watering_status === "due_soon" ||
      t.watering_status === "not_started"
  ) || [];

  const needsFertilizer = dueTasks?.filter(
    (t: PlantTask) => t.fertilizing_status === "overdue" || t.fertilizing_status === "due_soon"
  ) || [];

  // Calculate upcoming waterings (status is "ok" but due within 7 days)
  const upcomingWater: UpcomingTask[] = (dueTasks?.filter((t: PlantTask) => {
    if (t.watering_status !== "ok" || !t.water_due_at) return false;
    const daysUntil = getDaysUntilDue(t.water_due_at);
    return daysUntil > 0 && daysUntil <= 7;
  }) || []).map((t: PlantTask) => ({
    ...t,
    days_until_water: getDaysUntilDue(t.water_due_at),
  })).sort((a, b) => a.days_until_water - b.days_until_water);

  const allCaughtUp = needsWater.length === 0 && needsFertilizer.length === 0;
  const hasPlants = plantCount !== null && plantCount > 0;
  const totalCareTasks = needsWater.length + needsFertilizer.length;

  // Count stats
  const overdueWaterCount = needsWater.filter((t: PlantTask) => t.watering_status === "overdue").length;

  // Get greeting
  const { greeting, subtext } = getGreeting();
  const displayName = profile?.display_name;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {greeting}{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">{subtext}</p>
        </div>

        {/* Collection Stats */}
        {hasPlants && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link 
              href="/plants" 
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20 transition-colors"
            >
              <Leaf className="h-4 w-4" />
              <span className="font-medium">{plantCount}</span> plant{plantCount !== 1 ? "s" : ""}
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
                href="/journal"
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors"
              >
                <span className="font-medium">{activeIssueCount}</span> active issue{activeIssueCount !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Schedule Suggestions Banner */}
      {transformedSuggestions.length > 0 && (
        <ScheduleSuggestionBanner suggestions={transformedSuggestions} />
      )}

      {/* Care Tasks Section */}
      {totalCareTasks > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <Sprout className="h-5 w-5 text-primary" />
              Needs Attention
            </h2>
            {overdueWaterCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Droplets className="h-3 w-3" />
                {overdueWaterCount} thirsty
              </Badge>
            )}
          </div>

          {/* Watering tasks */}
          {needsWater.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Droplets className="h-4 w-4 text-blue-500" />
                Water
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {needsWater.slice(0, 6).map((task: PlantTask) => (
                  <Card key={`water-${task.plant_id}`} size="sm" className="group">
                    <CardContent className="flex items-center justify-between gap-2 py-3">
                      <div className="min-w-0 flex-1">
                        <Link 
                          href={`/plants/${task.plant_id}`} 
                          className="font-medium truncate block hover:text-primary transition-colors"
                        >
                          {task.plant_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {task.watering_status === "overdue" 
                            ? `${formatTimeAgo(task.last_watered_at)}` 
                            : task.watering_status === "not_started"
                              ? "Not tracked yet"
                              : "Due soon"}
                        </p>
                      </div>
                      <CareButton plantId={task.plant_id!} eventType="watered" variant="water" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {needsWater.length > 6 && (
                <p className="text-sm text-muted-foreground">
                  +{needsWater.length - 6} more plants need water
                </p>
              )}
            </div>
          )}

          {/* Fertilizing tasks */}
          {needsFertilizer.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Fertilize
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {needsFertilizer.slice(0, 3).map((task: PlantTask) => (
                  <Card key={`fert-${task.plant_id}`} size="sm" className="group">
                    <CardContent className="flex items-center justify-between gap-2 py-3">
                      <div className="min-w-0 flex-1">
                        <Link 
                          href={`/plants/${task.plant_id}`} 
                          className="font-medium truncate block hover:text-primary transition-colors"
                        >
                          {task.plant_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {task.fertilizing_status === "overdue" ? "Overdue" : "Due soon"}
                        </p>
                      </div>
                      <CareButton plantId={task.plant_id!} eventType="fertilized" variant="fertilize" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {needsFertilizer.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{needsFertilizer.length - 3} more plants need fertilizer
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* All caught up state */}
      {allCaughtUp && hasPlants && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">All caught up!</p>
              <p className="text-sm text-muted-foreground">
                Your plants are well cared for. Maybe write a journal entry?
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming Up This Week Section */}
      {upcomingWater.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <Clock className="h-5 w-5 text-blue-500" />
              Coming Up This Week
            </h2>
            <Badge variant="secondary" className="gap-1">
              <Droplets className="h-3 w-3" />
              {upcomingWater.length} upcoming
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Droplets className="h-4 w-4 text-blue-400" />
              Water soon
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingWater.slice(0, 6).map((task) => (
                <Card key={`upcoming-${task.plant_id}`} size="sm" className="group border-blue-200/50 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/20">
                  <CardContent className="flex items-center justify-between gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <Link 
                        href={`/plants/${task.plant_id}`} 
                        className="font-medium truncate block hover:text-primary transition-colors"
                      >
                        {task.plant_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {task.days_until_water === 1 
                          ? "Water tomorrow"
                          : `Water in ${task.days_until_water} days`}
                      </p>
                    </div>
                    <CareButton plantId={task.plant_id!} eventType="watered" variant="water" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {upcomingWater.length > 6 && (
              <p className="text-sm text-muted-foreground">
                +{upcomingWater.length - 6} more plants need water this week
              </p>
            )}
          </div>
        </section>
      )}

      {/* Spotlight & Quick Actions Row */}
      {hasPlants && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Plant Spotlight */}
          {spotlightPlant && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  Plant Spotlight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground italic">
                  {getSpotlightMessage(spotlightPlant)}
                </p>
                <div className="flex gap-3">
                  {spotlightPlant.photo_url && (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={spotlightPlant.photo_url}
                        alt={spotlightPlant.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link 
                      href={`/plants/${spotlightPlant.id}`}
                      className="font-serif text-lg font-semibold hover:text-primary transition-colors"
                    >
                      {spotlightPlant.name}
                    </Link>
                    {spotlightPlant.plant_type_name && (
                      <p className="text-sm text-muted-foreground">{spotlightPlant.plant_type_name}</p>
                    )}
                    {spotlightPlant.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {spotlightPlant.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/plants/${spotlightPlant.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                  <Link href={`/plants/${spotlightPlant.id}#journal`}>
                    <Button size="sm" variant="ghost">
                      <PenLine className="mr-1.5 h-3.5 w-3.5" />
                      Write
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Compass className="h-4 w-4 text-muted-foreground" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/plants?new=true">
                <Button variant="outline" className="h-auto flex-col gap-1 py-3">
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">Add Plant</span>
                </Button>
              </Link>
              <Link href="/plant-types">
                <Button variant="outline" className="h-auto flex-col gap-1 py-3">
                  <Compass className="h-5 w-5" />
                  <span className="text-xs">Browse Catalog</span>
                </Button>
              </Link>
              <Link href="/journal">
                <Button variant="outline" className="h-auto flex-col gap-1 py-3">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-xs">Journal</span>
                </Button>
              </Link>
              <Link href="/wishlist">
                <Button variant="outline" className="h-auto flex-col gap-1 py-3">
                  <Heart className="h-5 w-5" />
                  <span className="text-xs">Wishlist</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Journal Entries */}
      {recentJournal.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <BookOpen className="h-5 w-5 text-primary" />
              Recent Journal Entries
            </h2>
            <Link href="/journal">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentJournal.map((entry) => (
              <Card key={entry.id} className="group">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Link 
                          href={`/plants/${entry.plant_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {entry.plant_name}
                        </Link>
                        <span className="text-muted-foreground">·</span>
                        <time className="text-muted-foreground">{formatJournalDate(entry.entry_date)}</time>
                      </div>
                      {entry.title && (
                        <p className="mt-1 font-serif font-medium">{entry.title}</p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                    <Link href={`/plants/${entry.plant_id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Empty state for new users */}
      {!hasPlants && (
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
      )}
    </div>
  );
}
