import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Droplets, 
  Sun, 
  Sparkles, 
  Home, 
  TreePine, 
  MapPin, 
  Calendar,
  ExternalLink,
  History,
  AlertTriangle,
  Package,
  Leaf,
  Heart,
  Camera
} from "lucide-react";
import { getCurrentUserId } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CareButton } from "./care-button";
import { EditPlantDialog } from "./edit-plant-dialog";
import { CarePreferencesDialog } from "./care-preferences-dialog";
import { PlantPhotosSection } from "./plant-photos-section";
import { JournalEntryDialog } from "./journal-entry-dialog";
import { IssueDialog } from "./issue-dialog";
import { PlantTimeline } from "./plant-timeline";
import { RepotDialog } from "./repot-dialog";
import { ScheduleSuggestionCard } from "./schedule-suggestion-card";
import { PropagationSection } from "./propagation-section";
import { PotWithUsage } from "@/lib/queries/pots";
import { createScheduleSuggestion } from "./actions";
import { analyzeWateringSchedule } from "@/lib/watering-analysis";
import {
  getPlantDetail,
  getPlantEvents,
  getPlantJournalEntries,
  getPlantIssues,
  getPlantDueTask,
  getPlantCarePreferences,
  getWateringEventsForAnalysis,
  getActiveScheduleSuggestion,
  getPlantPhotos,
  getUserPotsWithPlantUsage,
  getParentPlant,
  getChildrenPlants,
  getPlantsForParentSelection,
} from "@/lib/queries/plants";

// Human-friendly labels for light requirement enum
const lightLabels: Record<string, string> = {
  dark: "Dark",
  low_indirect: "Low Indirect",
  medium_indirect: "Medium Indirect",
  bright_indirect: "Bright Indirect",
  direct: "Direct",
};

// Fun light descriptions
const lightVibes: Record<string, string> = {
  dark: "Loves the shadows 🌑",
  low_indirect: "Cozy corner dweller ☁️",
  medium_indirect: "Just right brightness ✨",
  bright_indirect: "Sun-kissed but shaded 🌤️",
  direct: "Sunbathing enthusiast ☀️",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ plantId: string }>;
}) {
  const { plantId } = await params;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Fetch all data in parallel using cached helpers
  const [
    { data: plant, error },
    { data: rawEvents },
    { data: journalEntries },
    { data: issues },
    { data: dueTask },
    { data: carePrefs },
    { data: wateringEvents },
    { data: activeSuggestion },
    { data: photos },
    { pots, activePlants },
  ] = await Promise.all([
    getPlantDetail(plantId, userId),
    getPlantEvents(plantId),
    getPlantJournalEntries(plantId),
    getPlantIssues(plantId),
    getPlantDueTask(plantId),
    getPlantCarePreferences(plantId),
    getWateringEventsForAnalysis(plantId),
    getActiveScheduleSuggestion(plantId),
    getPlantPhotos(plantId),
    getUserPotsWithPlantUsage(userId),
  ]);

  if (error || !plant) {
    notFound();
  }

  // Fetch propagation data (depends on plant.parent_plant_id)
  const [
    parentPlantResult,
    childrenPlantsResult,
    availablePlantsResult,
  ] = await Promise.all([
    plant.parent_plant_id ? getParentPlant(plant.parent_plant_id, userId) : Promise.resolve({ data: null }),
    getChildrenPlants(plantId, userId),
    getPlantsForParentSelection(userId, plantId),
  ]);

  const parentPlant = parentPlantResult.data;
  const childrenPlants = childrenPlantsResult.data || [];
  const availablePlantsForParent = availablePlantsResult.data || [];

  // Build a map of pot_id -> plant info for usage tracking
  const potUsageMap = new Map<string, { plantId: string; plantName: string }>();
  if (activePlants) {
    for (const p of activePlants) {
      if (p.current_pot_id) {
        potUsageMap.set(p.current_pot_id, { plantId: p.id, plantName: p.name });
      }
    }
  }

  // Build pots with usage info for repot dialog
  const potsWithUsage = (pots || []).map((pot) => {
    const usage = potUsageMap.get(pot.id);
    return {
      ...pot,
      in_use: !!usage,
      used_by_plant_id: usage?.plantId ?? null,
      used_by_plant_name: usage?.plantName ?? null,
    };
  }) as PotWithUsage[];

  // Filter to unused pots (not retired, not in use)
  const unusedPots = potsWithUsage.filter((p) => !p.is_retired && !p.in_use);

  const plantType = Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types;
  const currentPot = plant.current_pot_id ? pots?.find(p => p.id === plant.current_pot_id) : null;
  const currentPotSize = currentPot?.size_inches ?? null;

  // Enrich repot events with pot names (after pots are fetched)
  const events = rawEvents?.map(event => {
    if (event.event_type === "repotted" && event.metadata) {
      const metadata = event.metadata as { from_pot_id?: string; to_pot_id?: string };
      const fromPot = metadata.from_pot_id ? pots?.find(p => p.id === metadata.from_pot_id) : null;
      const toPot = metadata.to_pot_id ? pots?.find(p => p.id === metadata.to_pot_id) : null;
      return {
        ...event,
        metadata: {
          ...metadata,
          from_pot_name: fromPot?.name || null,
          to_pot_name: toPot?.name || null,
        },
      };
    }
    return event;
  });
  
  // Compute thumbnail URL (active photo if set, otherwise most recent)
  const activePhoto = plant.active_photo_id
    ? photos?.find(p => p.id === plant.active_photo_id) ?? photos?.[0]
    : photos?.[0];
  const thumbnailUrl = activePhoto?.url ?? null;

  // Build photo map for propagation section (parent + children thumbnails)
  // For now, we'll use a simple approach - in a real app you might batch fetch these photos
  const propagationPhotoMap = new Map<string, string>();
  // We don't have photos for parent/children yet, they'll show the Leaf icon placeholder

  // Determine if using custom values
  const hasCustomWatering = carePrefs?.watering_frequency_days !== null && carePrefs?.watering_frequency_days !== undefined;
  const hasCustomFertilizing = carePrefs?.fertilizing_frequency_days !== null && carePrefs?.fertilizing_frequency_days !== undefined;
  const hasAnyCustomCare = hasCustomWatering || hasCustomFertilizing;
  const needsWater = dueTask?.watering_status === "overdue" || dueTask?.watering_status === "due_soon" || dueTask?.watering_status === "not_started";
  const needsFertilizer = dueTask?.fertilizing_status === "overdue" || dueTask?.fertilizing_status === "due_soon";
  
  // Count active issues
  const activeIssues = issues?.filter(i => i.status === "active") || [];

  // Analyze watering schedule and manage suggestions
  let scheduleSuggestion = activeSuggestion;
  const currentWateringInterval = dueTask?.watering_frequency_days ?? null;
  
  // Only run analysis if we have enough events and a current schedule
  if (wateringEvents && wateringEvents.length >= 5 && currentWateringInterval) {
    const analysis = analyzeWateringSchedule(wateringEvents, currentWateringInterval);
    
    // If analysis suggests a change and we don't have an active suggestion, create one
    if (analysis.shouldSuggest && analysis.suggestedDays && !activeSuggestion) {
      // Create suggestion in the background (don't await to not block render)
      createScheduleSuggestion(plantId, {
        suggestedIntervalDays: analysis.suggestedDays,
        currentIntervalDays: currentWateringInterval,
        confidenceScore: analysis.confidence,
      }).then(result => {
        if (result.success && result.suggestionId) {
          // The page will show the suggestion on next visit or revalidation
        }
      });
      
      // Create a temporary suggestion object for immediate display
      scheduleSuggestion = {
        id: "pending",
        plant_id: plantId,
        user_id: userId,
        suggested_interval_days: analysis.suggestedDays,
        current_interval_days: currentWateringInterval,
        confidence_score: analysis.confidence,
        detected_at: new Date().toISOString(),
        dismissed_at: null,
        accepted_at: null,
        created_at: new Date().toISOString(),
      };
    }
  }
  
  // Get light info
  const plantTypeLightMin = plantType?.light_min ?? null;
  const plantTypeLightMax = plantType?.light_max ?? null;
  const lightRangeLabel =
    plantTypeLightMin && plantTypeLightMax
      ? (plantTypeLightMin === plantTypeLightMax
        ? lightLabels[plantTypeLightMin]
        : `${lightLabels[plantTypeLightMin]} to ${lightLabels[plantTypeLightMax]}`)
      : null;
  const lightLevel =
    plant.light_exposure || (plantTypeLightMin === plantTypeLightMax ? plantTypeLightMin : "");
  const lightBadgeLabel = plant.light_exposure
    ? lightLabels[plant.light_exposure]
    : lightRangeLabel;
  const lightVibe = lightLevel ? lightVibes[lightLevel] : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Back link */}
      <Link href="/plants">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to plants
        </Button>
      </Link>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION - The star of the show
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/10">
        <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
          {/* Main Photo - Large and Prominent */}
          <div className="relative mx-auto lg:mx-0 shrink-0">
            {thumbnailUrl ? (
              <div className="relative group">
                {/* Decorative ring */}
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-sm" />
                <div className="relative h-64 w-64 sm:h-80 sm:w-80 overflow-hidden rounded-xl bg-muted ring-4 ring-background shadow-xl">
                  <Image
                    src={thumbnailUrl}
                    alt={plant.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 256px, 320px"
                    priority
                  />
                </div>
                {/* Photo count badge */}
                {photos && photos.length > 1 && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
                    <Camera className="h-3 w-3" />
                    {photos.length}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative h-64 w-64 sm:h-80 sm:w-80 overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 ring-4 ring-background shadow-xl flex items-center justify-center">
                <div className="text-center p-6">
                  <Leaf className="h-16 w-16 mx-auto text-primary/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No photo yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add one to see your plant shine!</p>
                </div>
              </div>
            )}
          </div>

          {/* Plant Info */}
          <div className="flex-1 flex flex-col justify-center text-center lg:text-left">
            <div className="space-y-3">
              {/* Plant name with fun styling */}
              <div>
                <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {plant.name}
                </h1>
                {plant.nickname && (
                  <p className="mt-2 text-xl text-muted-foreground italic">
                    &ldquo;{plant.nickname}&rdquo;
                  </p>
                )}
              </div>

              {/* Plant type link */}
              {plantType && (
                <Link 
                  href={`/plant-types/${plantType.id}`}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Leaf className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="font-medium">{plantType.name}</span>
                  {plantType.scientific_name && (
                    <span className="italic text-sm opacity-75">({plantType.scientific_name})</span>
                  )}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )}

              {/* Quick stats pills */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  {plant.plant_location === "indoor" ? (
                    <>
                      <Home className="h-3.5 w-3.5 text-blue-500" />
                      Indoor plant
                    </>
                  ) : (
                    <>
                      <TreePine className="h-3.5 w-3.5 text-green-500" />
                      Outdoor plant
                    </>
                  )}
                </Badge>
                {plant.location && (
                  <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    {plant.location}
                  </Badge>
                )}
                {lightBadgeLabel && (
                  <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    {lightBadgeLabel}
                  </Badge>
                )}
              </div>

              {/* Origin story */}
              {(plant.acquired_at || plant.how_acquired) && (
                <p className="text-sm text-muted-foreground pt-1">
                  <Heart className="inline h-3.5 w-3.5 mr-1 text-pink-400" />
                  {plant.how_acquired ? (
                    <>
                      {plant.how_acquired}
                      {plant.acquired_at && <> · {formatDateRelative(plant.acquired_at)}</>}
                    </>
                  ) : plant.acquired_at ? (
                    <>Part of the family since {formatDate(plant.acquired_at)}</>
                  ) : null}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
              <EditPlantDialog
                plant={{
                  id: plant.id,
                  name: plant.name,
                  nickname: plant.nickname,
                  plant_location: plant.plant_location as "indoor" | "outdoor",
                  location: plant.location,
                  light_exposure: plant.light_exposure,
                  size_category: plant.size_category,
                  how_acquired: plant.how_acquired,
                  description: plant.description,
                  acquired_at: plant.acquired_at,
                }}
              />
              <CareButton
                plantId={plant.id}
                eventType="watered"
                variant="water"
                status={dueTask?.watering_status}
              />
              <CareButton
                plantId={plant.id}
                eventType="fertilized"
                variant="fertilize"
                status={dueTask?.fertilizing_status}
              />
            </div>
          </div>
        </div>

        {/* Decorative leaf elements */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CARE STATUS STRIP - Shows overdue reminders and active issues
      ═══════════════════════════════════════════════════════════════════ */}
      {(needsWater || needsFertilizer || activeIssues.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-orange-500/5 border border-primary/10">
          {needsWater && dueTask?.watering_status === "overdue" && (
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Droplets className="h-4 w-4" />
              Thirsty! Time to water
            </span>
          )}
          {needsWater && dueTask?.watering_status === "due_soon" && (
            <span className="text-sm font-medium text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
              <Droplets className="h-4 w-4" />
              Water soon
            </span>
          )}
          {needsFertilizer && dueTask?.fertilizing_status === "overdue" && (
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Ready for fertilizer
            </span>
          )}
          {activeIssues.length > 0 && (
            <>
              {(needsWater || needsFertilizer) && <div className="h-6 w-px bg-border mx-1" />}
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {activeIssues.length} issue{activeIssues.length > 1 ? "s" : ""}
              </span>
              <IssueDialog plantId={plant.id} plantName={plant.name} />
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PLANT VITALS - The important stuff
      ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-serif text-xl font-medium">Plant Vitals</h2>
          <span className="text-muted-foreground">📋</span>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Care Schedule Card */}
          <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded-lg bg-purple-500/10">
                    <Calendar className="h-4 w-4 text-purple-500" />
                  </div>
                  Care Rhythm
                  {hasAnyCustomCare && (
                    <Badge variant="secondary" className="text-xs">
                      Custom
                    </Badge>
                  )}
                </CardTitle>
                <CarePreferencesDialog
                  plantId={plant.id}
                  plantName={plant.name}
                  effectiveWateringDays={dueTask?.watering_frequency_days ?? null}
                  effectiveFertilizingDays={dueTask?.fertilizing_frequency_days ?? null}
                  customWateringDays={carePrefs?.watering_frequency_days ?? null}
                  customFertilizingDays={carePrefs?.fertilizing_frequency_days ?? null}
                  recommendedWateringDays={plantType?.watering_frequency_days ?? null}
                  recommendedFertilizingDays={plantType?.fertilizing_frequency_days ?? null}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dueTask?.watering_frequency_days ? (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    Water every <span className="font-medium">{dueTask.watering_frequency_days} days</span>
                    {hasCustomWatering && <span className="text-xs text-muted-foreground ml-1">(custom)</span>}
                  </span>
                </div>
              ) : null}
              {dueTask?.fertilizing_frequency_days ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">
                    Feed every <span className="font-medium">{dueTask.fertilizing_frequency_days} days</span>
                    {hasCustomFertilizing && <span className="text-xs text-muted-foreground ml-1">(custom)</span>}
                  </span>
                </div>
              ) : null}
              {!dueTask?.watering_frequency_days && !dueTask?.fertilizing_frequency_days && (
                <p className="text-sm text-muted-foreground">
                  No schedule yet — set one to get reminders! 🔔
                </p>
              )}
            </CardContent>
          </Card>

          {/* Light Preferences */}
          {lightBadgeLabel && (
            <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <Sun className="h-4 w-4 text-amber-500" />
                  </div>
                  Light Vibes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{lightBadgeLabel}</p>
                {lightVibe && (
                  <p className="text-sm text-muted-foreground mt-1">{lightVibe}</p>
                )}
                {plant.light_exposure && lightRangeLabel && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <span>💡</span> Species prefers {lightRangeLabel}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current Pot */}
          <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded-lg bg-orange-500/10">
                    <Package className="h-4 w-4 text-orange-500" />
                  </div>
                  Home Sweet Pot
                </CardTitle>
                <RepotDialog
                  plantId={plant.id}
                  plantName={plant.name}
                  currentPotId={plant.current_pot_id}
                  currentPotSize={currentPotSize}
                  pots={pots || []}
                  unusedPots={unusedPots}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentPot ? (
                <div className="flex items-center gap-3">
                  {currentPot.photo_url ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-2 ring-background">
                      <Image
                        src={currentPot.photo_url}
                        alt={currentPot.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{currentPot.name}</p>
                    {(currentPot.size_inches || currentPot.material) && (
                      <p className="text-sm text-muted-foreground">
                        {[
                          currentPot.size_inches ? `${currentPot.size_inches}"` : null,
                          currentPot.material,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not in a pot yet — time to find the perfect home! 🏺
                </p>
              )}
              <Link 
                href="/pots" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Manage pot inventory
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Suggestion Card */}
        {scheduleSuggestion && scheduleSuggestion.id !== "pending" && (
          <div className="mt-4">
            <ScheduleSuggestionCard
              suggestionId={scheduleSuggestion.id}
              plantId={plant.id}
              plantName={plant.name}
              currentIntervalDays={scheduleSuggestion.current_interval_days}
              suggestedIntervalDays={scheduleSuggestion.suggested_interval_days}
              confidenceScore={scheduleSuggestion.confidence_score}
            />
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PROPAGATION - Plant lineage
      ═══════════════════════════════════════════════════════════════════ */}
      <PropagationSection
        plantId={plant.id}
        plantName={plant.name}
        plantTypeId={plant.plant_type_id}
        parentPlant={parentPlant}
        childrenPlants={childrenPlants}
        availablePlantsForParent={availablePlantsForParent}
        photoMap={propagationPhotoMap}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          ABOUT THIS PLANT - Personal notes
      ═══════════════════════════════════════════════════════════════════ */}
      {plant.description && (
        <section>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span>📝</span>
                My Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {plant.description}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PHOTO GALLERY - Visual memories
      ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-serif text-xl font-medium">Photo Gallery</h2>
          <span className="text-muted-foreground">📸</span>
        </div>
        <PlantPhotosSection
          plantId={plant.id}
          plantName={plant.name}
          photos={photos || []}
          activePhotoId={plant.active_photo_id}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TIMELINE - The plant's story
      ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-serif">
                  <History className="h-5 w-5" />
                  {plant.name}&apos;s Story
                </CardTitle>
                <CardDescription>
                  Care events, journal entries, and adventures
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <IssueDialog plantId={plant.id} plantName={plant.name} />
                <JournalEntryDialog plantId={plant.id} plantName={plant.name} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
  <PlantTimeline
    events={events || []}
    journalEntries={journalEntries || []}
    issues={issues || []}
    plantId={plant.id}
    plantName={plant.name}
    currentPotId={plant.current_pot_id}
    currentPotSize={currentPotSize}
    pots={potsWithUsage}
    unusedPots={unusedPots}
            />
          </CardContent>
        </Card>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PLANT TYPE INFO - Species information
      ═══════════════════════════════════════════════════════════════════ */}
      {plantType && (
        <section>
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-primary/5">
            <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Leaf className="h-5 w-5 text-primary" />
                About {plantType.name}
              </CardTitle>
              {plantType.scientific_name && (
                <CardDescription className="italic">
                  {plantType.scientific_name}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {plantType.description && (
                <p className="text-muted-foreground leading-relaxed">{plantType.description}</p>
              )}
              <Link href={`/plant-types/${plantType.id}`}>
                <Button variant="outline" size="sm">
                  Explore in catalog
                  <ExternalLink className="ml-1.5 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
