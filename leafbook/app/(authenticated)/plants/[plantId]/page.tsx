import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Calendar,
  Droplets,
  ExternalLink,
  History,
  Leaf,
  Package,
  Sparkles,
  Sun,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getActiveScheduleSuggestion,
  getChildrenPlants,
  getParentPlant,
  getPlantCarePreferences,
  getPlantDetail,
  getPlantDueTask,
  getPlantEvents,
  getPlantIssues,
  getPlantJournalEntries,
  getPlantPhotos,
  getPlantPhotosForPlants,
  getPlantsForParentSelection,
  getUserPotsWithPlantUsage,
  getWateringEventsForAnalysis,
} from "@/lib/queries/plants";
import { PotWithUsage } from "@/lib/queries/pots";
import { getCurrentUserId } from "@/lib/supabase/server";
import { analyzeWateringSchedule } from "@/lib/watering-analysis";

import { createScheduleSuggestion } from "./actions";
import { CarePreferencesDialog } from "./care-preferences-dialog";
import { IssueDialog } from "./issue-dialog";
import { JournalEntryDialog } from "./journal-entry-dialog";
import { LegacyDialog } from "./legacy-dialog";
import { PlantHero } from "./plant-hero";
import { PlantPhotosSection } from "./plant-photos-section";
import { PlantTimeline } from "./plant-timeline";
import { PropagationSection } from "./propagation-section";
import { RepotDialog } from "./repot-dialog";
import { ScheduleSuggestionCard } from "./schedule-suggestion-card";

export const metadata = {
  title: "Plant | Leafbook",
  description: "Plant details, timeline, and care",
};

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

  const propagationPlantIds = [
    parentPlant?.id,
    ...childrenPlants.map((child) => child.id),
  ].filter(Boolean) as string[];

  const { data: propagationPhotos } = await getPlantPhotosForPlants(propagationPlantIds);

  const propagationPhotosByPlant = new Map<string, { id: string; url: string }[]>();
  propagationPhotos?.forEach((photo) => {
    const existing = propagationPhotosByPlant.get(photo.plant_id) || [];
    existing.push({ id: photo.id, url: photo.url });
    propagationPhotosByPlant.set(photo.plant_id, existing);
  });

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
  const propagationPhotoMap = new Map<string, string>();
  const resolvePropagationPhoto = (plant: { id: string; active_photo_id: string | null }) => {
    const photos = propagationPhotosByPlant.get(plant.id);
    if (!photos || photos.length === 0) {
      return null;
    }
    if (plant.active_photo_id) {
      return photos.find((photo) => photo.id === plant.active_photo_id)?.url ?? photos[0].url;
    }
    return photos[0].url;
  };

  if (parentPlant) {
    const parentPhotoUrl = resolvePropagationPhoto(parentPlant);
    if (parentPhotoUrl) {
      propagationPhotoMap.set(parentPlant.id, parentPhotoUrl);
    }
  }

  childrenPlants.forEach((child) => {
    const childPhotoUrl = resolvePropagationPhoto(child);
    if (childPhotoUrl) {
      propagationPhotoMap.set(child.id, childPhotoUrl);
    }
  });

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
      <PlantHero
        plant={plant}
        plantType={plantType}
        thumbnailUrl={thumbnailUrl}
        photos={(photos || []).map((photo) => ({ id: photo.id, url: photo.url }))}
        lightBadgeLabel={lightBadgeLabel}
        dueTask={dueTask ?? null}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          LEGACY BANNER - Shows when plant is legacy
      ═══════════════════════════════════════════════════════════════════ */}
      {plant.is_legacy && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-4 rounded-xl bg-muted/50 border border-muted-foreground/20">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Legacy Plant</span>
          </div>
          <div className="flex-1">
            {plant.legacy_reason && (
              <p className="text-sm text-muted-foreground">{plant.legacy_reason}</p>
            )}
            {plant.legacy_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Since {new Date(plant.legacy_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          <LegacyDialog
            plantId={plant.id}
            plantName={plant.name}
            isLegacy={plant.is_legacy}
            legacyReason={plant.legacy_reason}
            legacyAt={plant.legacy_at}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CARE STATUS STRIP - Shows overdue reminders and active issues
      ═══════════════════════════════════════════════════════════════════ */}
      {!plant.is_legacy && (needsWater || needsFertilizer || activeIssues.length > 0) && (
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
          PLANT VITALS - The important stuff (hidden for legacy plants)
      ═══════════════════════════════════════════════════════════════════ */}
      {!plant.is_legacy && (
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
      )}

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
                <JournalEntryDialog
                  plantId={plant.id}
                  plantName={plant.name}
                  availableEvents={events || []}
                />
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
    availablePlantsForParent={availablePlantsForParent}
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
