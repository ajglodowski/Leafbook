import {
  Archive,
  Camera,
  Droplets,
  ExternalLink,
  Heart,
  Home,
  Leaf,
  MapPin,
  Sun,
  TreePine,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import { CareButton } from "./care-button";
import { EditPlantDialog } from "./edit-plant-dialog";
import { LegacyDialog } from "./legacy-dialog";
import { MoveDialog } from "./move-dialog";

type PlantHeroPlant = {
  id: string;
  name: string;
  nickname: string | null;
  plant_location: "indoor" | "outdoor" | null;
  location: string | null;
  light_exposure: string | null;
  size_category: string | null;
  how_acquired: string | null;
  description: string | null;
  acquired_at: string | null;
  is_legacy: boolean;
  legacy_reason: string | null;
  legacy_at: string | null;
  active_photo_id: string | null;
};

type PlantHeroType = {
  id: string;
  name: string;
  scientific_name: string | null;
} | null;

type PlantHeroTask = {
  watering_status: string | null;
  fertilizing_status: string | null;
  last_watered_at: string | null;
} | null;

type PlantHeroProps = {
  plant: PlantHeroPlant;
  plantType: PlantHeroType;
  thumbnailUrl: string | null;
  photos: Array<{ id: string; url: string }>;
  lightBadgeLabel: string | null;
  dueTask: PlantHeroTask;
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
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

function formatDaysAgo(dateString: string | null): string {
  if (!dateString) return "Not watered yet";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  );
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function PlantHero({
  plant,
  plantType,
  thumbnailUrl,
  photos,
  lightBadgeLabel,
  dueTask,
}: PlantHeroProps) {
  const lastWateredLabel = formatDaysAgo(dueTask?.last_watered_at ?? null);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/10">
      <div className="px-6 pt-6 lg:px-8 lg:pt-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Droplets className="h-4 w-4 text-blue-500" />
          <span>Last watered {lastWateredLabel}</span>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 px-6 pb-6 pt-4 lg:px-8 lg:pb-8 lg:pt-4">
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
              {photos.length > 1 && (
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
              {plant.is_legacy && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-muted">
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                  Legacy
                </Badge>
              )}
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
            {!plant.is_legacy && (
              <>
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
                <MoveDialog
                  plantId={plant.id}
                  plantName={plant.name}
                  currentLocation={plant.location}
                />
              </>
            )}
            <LegacyDialog
              plantId={plant.id}
              plantName={plant.name}
              isLegacy={plant.is_legacy}
              legacyReason={plant.legacy_reason}
              legacyAt={plant.legacy_at}
            />
          </div>
        </div>
      </div>

      {/* Decorative leaf elements */}
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
    </div>
  );
}
