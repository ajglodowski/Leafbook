import { notFound } from "next/navigation";
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
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch plant with plant type info and active photo
  const { data: plant, error } = await supabase
    .from("plants")
    .select(`
      id,
      name,
      nickname,
      plant_location,
      location,
      light_exposure,
      size_category,
      is_active,
      created_at,
      acquired_at,
      how_acquired,
      description,
      plant_type_id,
      active_photo_id,
      current_pot_id,
      plant_types (
        id,
        name,
        scientific_name,
        watering_frequency_days,
        fertilizing_frequency_days,
        light_min,
        light_max,
        description
      )
    `)
    .eq("id", plantId)
    .eq("user_id", user!.id)
    .single();

  if (error || !plant) {
    notFound();
  }

  // Fetch care events for timeline
  const { data: rawEvents } = await supabase
    .from("plant_events")
    .select("id, event_type, event_date, notes, metadata")
    .eq("plant_id", plantId)
    .order("event_date", { ascending: false })
    .limit(20);

  // Fetch journal entries for timeline
  const { data: journalEntries } = await supabase
    .from("journal_entries")
    .select("id, title, content, entry_date")
    .eq("plant_id", plantId)
    .order("entry_date", { ascending: false })
    .limit(20);

  // Fetch plant issues for timeline
  const { data: issues } = await supabase
    .from("plant_issues")
    .select("id, issue_type, severity, status, description, started_at, resolved_at, resolution_notes")
    .eq("plant_id", plantId)
    .order("started_at", { ascending: false })
    .limit(20);

  // Fetch due task status
  const { data: dueTask } = await supabase
    .from("v_plant_due_tasks")
    .select("*")
    .eq("plant_id", plantId)
    .single();

  // Fetch plant care preferences (user overrides)
  const { data: carePrefs } = await supabase
    .from("plant_care_preferences")
    .select("watering_frequency_days, fertilizing_frequency_days")
    .eq("plant_id", plantId)
    .maybeSingle();

  // Fetch photos for this plant
  const { data: photos } = await supabase
    .from("plant_photos")
    .select("id, url, caption, taken_at")
    .eq("plant_id", plantId)
    .order("taken_at", { ascending: false });

  // Fetch user's pots for repot dialog
  const { data: pots } = await supabase
    .from("user_pots")
    .select("id, name, size_inches, material, photo_url, is_retired")
    .eq("user_id", user!.id)
    .order("is_retired", { ascending: true })
    .order("created_at", { ascending: false });

  const plantType = Array.isArray(plant.plant_types) ? plant.plant_types[0] : plant.plant_types;
  const currentPot = plant.current_pot_id ? pots?.find(p => p.id === plant.current_pot_id) : null;

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

  // Determine if using custom values
  const hasCustomWatering = carePrefs?.watering_frequency_days !== null && carePrefs?.watering_frequency_days !== undefined;
  const hasCustomFertilizing = carePrefs?.fertilizing_frequency_days !== null && carePrefs?.fertilizing_frequency_days !== undefined;
  const hasAnyCustomCare = hasCustomWatering || hasCustomFertilizing;
  const needsWater = dueTask?.watering_status === "overdue" || dueTask?.watering_status === "due_soon" || dueTask?.watering_status === "not_started";
  const needsFertilizer = dueTask?.fertilizing_status === "overdue" || dueTask?.fertilizing_status === "due_soon";
  
  // Count active issues
  const activeIssues = issues?.filter(i => i.status === "active") || [];
  
  // Get light info
  const lightLevel = plant.light_exposure || plantType?.light_requirement || "";
  const lightVibe = lightVibes[lightLevel] || null;

  return (
    <div className="space-y-8 pb-12">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" render={<Link href="/plants" />}>
        <ArrowLeft className="h-4 w-4" />
        Back to plants
      </Button>

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
                {lightLevel && (
                  <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    {lightLabels[lightLevel]}
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

            {/* Edit button */}
            <div className="mt-6 flex justify-center lg:justify-start">
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
            </div>
          </div>
        </div>

        {/* Decorative leaf elements */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CARE ACTION STRIP - Compact inline actions
      ═══════════════════════════════════════════════════════════════════ */}
      {(needsWater || needsFertilizer || activeIssues.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-orange-500/5 border border-primary/10">
          {(needsWater || needsFertilizer) && (
            <>
              <span className="text-sm font-medium text-primary flex items-center gap-1.5">
                <span>🌿</span> Care time:
              </span>
              {needsWater && (
                <CareButton
                  plantId={plant.id}
                  eventType="watered"
                  variant="water"
                  status={dueTask?.watering_status}
                />
              )}
              {needsFertilizer && (
                <CareButton
                  plantId={plant.id}
                  eventType="fertilized"
                  variant="fertilize"
                  status={dueTask?.fertilizing_status}
                />
              )}
            </>
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
          {lightLevel && (
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
                <p className="font-medium">{lightLabels[lightLevel]}</p>
                {lightVibe && (
                  <p className="text-sm text-muted-foreground mt-1">{lightVibe}</p>
                )}
                {plant.light_exposure && plantType?.light_min && plantType?.light_max && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <span>💡</span> Species prefers {
                      plantType.light_min === plantType.light_max 
                        ? lightLabels[plantType.light_min] 
                        : `${lightLabels[plantType.light_min]} to ${lightLabels[plantType.light_max]}`
                    }
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
                  pots={pots || []}
                />
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </section>

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
              <Button variant="outline" size="sm" render={<Link href={`/plant-types/${plantType.id}`} />}>
                Explore in catalog
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
