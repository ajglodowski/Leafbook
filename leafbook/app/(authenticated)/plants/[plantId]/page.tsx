import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Droplets, 
  Sun, 
  Sparkles, 
  Home, 
  TreePine, 
  MapPin, 
  Calendar,
  Pencil,
  ExternalLink,
  History
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CareButton } from "./care-button";
import { EditPlantDialog } from "./edit-plant-dialog";
import { CarePreferencesDialog } from "./care-preferences-dialog";

// Human-friendly labels for light requirement enum
const lightLabels: Record<string, string> = {
  dark: "Dark",
  low_indirect: "Low Indirect",
  medium_indirect: "Medium Indirect",
  bright_indirect: "Bright Indirect",
  direct: "Direct",
};

// Human-friendly labels for event types
const eventLabels: Record<string, { label: string; icon: string; color: string }> = {
  watered: { label: "Watered", icon: "💧", color: "text-blue-600" },
  fertilized: { label: "Fertilized", icon: "✨", color: "text-amber-600" },
  repotted: { label: "Repotted", icon: "🪴", color: "text-orange-600" },
  pruned: { label: "Pruned", icon: "✂️", color: "text-green-600" },
  rotated: { label: "Rotated", icon: "🔄", color: "text-purple-600" },
  misted: { label: "Misted", icon: "💨", color: "text-cyan-600" },
  cleaned: { label: "Cleaned", icon: "🧹", color: "text-gray-600" },
  propagated: { label: "Propagated", icon: "🌱", color: "text-emerald-600" },
  acquired: { label: "Acquired", icon: "🎁", color: "text-pink-600" },
  other: { label: "Other", icon: "📝", color: "text-gray-600" },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? "s" : ""} ago`;
}

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ plantId: string }>;
}) {
  const { plantId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch plant with plant type info
  const { data: plant, error } = await supabase
    .from("plants")
    .select(`
      id,
      name,
      nickname,
      is_indoor,
      location,
      light_exposure,
      is_active,
      created_at,
      acquired_at,
      how_acquired,
      description,
      plant_type_id,
      plant_types (
        id,
        name,
        scientific_name,
        watering_frequency_days,
        fertilizing_frequency_days,
        light_requirement,
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
  const { data: events } = await supabase
    .from("plant_events")
    .select("id, event_type, event_date, notes")
    .eq("plant_id", plantId)
    .order("event_date", { ascending: false })
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

  const plantType = plant.plant_types;
  
  // Determine if using custom values
  const hasCustomWatering = carePrefs?.watering_frequency_days !== null && carePrefs?.watering_frequency_days !== undefined;
  const hasCustomFertilizing = carePrefs?.fertilizing_frequency_days !== null && carePrefs?.fertilizing_frequency_days !== undefined;
  const hasAnyCustomCare = hasCustomWatering || hasCustomFertilizing;
  const needsWater = dueTask?.watering_status === "overdue" || dueTask?.watering_status === "due_soon" || dueTask?.watering_status === "not_started";
  const needsFertilizer = dueTask?.fertilizing_status === "overdue" || dueTask?.fertilizing_status === "due_soon";

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" render={<Link href="/plants" />}>
        <ArrowLeft className="h-4 w-4" />
        Back to plants
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {plant.name}
          </h1>
          {plant.nickname && (
            <p className="mt-1 text-lg text-muted-foreground">
              "{plant.nickname}"
            </p>
          )}
          {plantType && (
            <Link 
              href={`/plant-types/${plantType.id}`}
              className="mt-1 inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              {plantType.name}
              {plantType.scientific_name && (
                <span className="italic"> · {plantType.scientific_name}</span>
              )}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        
        {/* Edit button */}
        <EditPlantDialog
          plant={{
            id: plant.id,
            name: plant.name,
            nickname: plant.nickname,
            is_indoor: plant.is_indoor,
            location: plant.location,
            light_exposure: plant.light_exposure,
            how_acquired: plant.how_acquired,
            description: plant.description,
            acquired_at: plant.acquired_at,
          }}
        />
      </div>

      {/* Quick care actions */}
      {(needsWater || needsFertilizer) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-3 pt-4">
            <span className="text-sm font-medium">Quick care:</span>
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
          </CardContent>
        </Card>
      )}

      {/* Environment & Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Environment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {plant.is_indoor ? (
                <Home className="h-5 w-5 text-blue-500" />
              ) : (
                <TreePine className="h-5 w-5 text-green-500" />
              )}
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{plant.is_indoor ? "Indoor" : "Outdoor"}</p>
            {plant.location && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {plant.location}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Light */}
        {(plant.light_exposure || plantType?.light_requirement) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="h-5 w-5 text-amber-500" />
                Light
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {lightLabels[plant.light_exposure || plantType?.light_requirement || ""] || "Not specified"}
              </p>
              {plant.light_exposure && plantType?.light_requirement && plant.light_exposure !== plantType.light_requirement && (
                <p className="text-sm text-muted-foreground">
                  Recommended: {lightLabels[plantType.light_requirement]}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Care Schedule */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-purple-500" />
                Care Schedule
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
          <CardContent className="space-y-1">
            {dueTask?.watering_frequency_days && (
              <p className="flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-blue-500" />
                Water every {dueTask.watering_frequency_days} days
                {hasCustomWatering && (
                  <span className="text-xs text-muted-foreground">(custom)</span>
                )}
              </p>
            )}
            {dueTask?.fertilizing_frequency_days && (
              <p className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Fertilize every {dueTask.fertilizing_frequency_days} days
                {hasCustomFertilizing && (
                  <span className="text-xs text-muted-foreground">(custom)</span>
                )}
              </p>
            )}
            {!dueTask?.watering_frequency_days && !dueTask?.fertilizing_frequency_days && (
              <p className="text-sm text-muted-foreground">
                No schedule set. Click Customize to add one.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Acquired date */}
        {(plant.acquired_at || plant.how_acquired) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-pink-500" />
                How I Got It
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plant.acquired_at && (
                <p className="font-medium">{formatDate(plant.acquired_at)}</p>
              )}
              {plant.how_acquired && (
                <p className="text-sm text-muted-foreground">{plant.how_acquired}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description/Notes */}
      {plant.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About This Plant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {plant.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Care History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Care History
          </CardTitle>
          <CardDescription>
            Recent care events for this plant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event, index) => {
                const eventConfig = eventLabels[event.event_type] || eventLabels.other;
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3"
                  >
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <span className="text-lg">{eventConfig.icon}</span>
                      {index < events.length - 1 && (
                        <div className="mt-1 h-8 w-px bg-border" />
                      )}
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${eventConfig.color}`}>
                          {eventConfig.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(event.event_date)}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {event.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.event_date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <History className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No care history yet</p>
              <p className="text-sm">Log your first care event to start tracking!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plant type info card */}
      {plantType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About {plantType.name}</CardTitle>
            {plantType.scientific_name && (
              <CardDescription className="italic">
                {plantType.scientific_name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {plantType.description && (
              <p className="text-muted-foreground">{plantType.description}</p>
            )}
            <Button variant="outline" size="sm" render={<Link href={`/plant-types/${plantType.id}`} />}>
              View in catalog
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
