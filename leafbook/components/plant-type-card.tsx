import Link from "next/link";
import Image from "next/image";
import { Droplets, Sun, Ruler, Leaf, Home, TreePine, Combine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/lib/supabase/database.types";

type PlantType = Tables<"plant_types">;

// Human-friendly labels for enums
const lightLabels: Record<string, string> = {
  dark: "Dark",
  low_indirect: "Low Indirect",
  medium_indirect: "Medium Indirect",
  bright_indirect: "Bright Indirect",
  direct: "Direct",
};

const sizeLabels: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra Large",
};

const locationIcons: Record<string, typeof Home> = {
  indoor: Home,
  outdoor: TreePine,
  both: Combine,
};

// Helper to format a range display
function formatRange(min: string | null, max: string | null, labels: Record<string, string>): string | null {
  if (!min && !max) return null;
  const minLabel = min ? labels[min] || min : null;
  const maxLabel = max ? labels[max] || max : null;
  
  if (minLabel && maxLabel) {
    return minLabel === maxLabel ? minLabel : `${minLabel}–${maxLabel}`;
  }
  return minLabel || maxLabel;
}

interface PlantTypeCardProps {
  plantType: PlantType;
  primaryPhotoUrl?: string | null;
}

export function PlantTypeCard({ plantType, primaryPhotoUrl }: PlantTypeCardProps) {
  return (
    <Link href={`/plant-types/${plantType.id}`} className="block">
      <Card className="h-full pt-0 overflow-hidden transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
        {/* Photo thumbnail */}
        <div className="relative aspect-square w-full">
          {primaryPhotoUrl ? (
            <Image
              src={primaryPhotoUrl}
              alt={plantType.name}
              fill
              className="object-cover rounded-b-2xl"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Leaf className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg">{plantType.name}</CardTitle>
          {plantType.scientific_name && (
            <CardDescription className="italic">
              {plantType.scientific_name}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {plantType.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plantType.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            {plantType.location_preference && (
              (() => {
                const LocationIcon = locationIcons[plantType.location_preference] || Home;
                return (
                  <Badge variant="secondary" className="gap-1">
                    <LocationIcon className="h-3 w-3" />
                    {plantType.location_preference === "both" ? "Indoor/Outdoor" : 
                      plantType.location_preference.charAt(0).toUpperCase() + plantType.location_preference.slice(1)}
                  </Badge>
                );
              })()
            )}
            {(plantType.light_min || plantType.light_max) && (
              <Badge variant="secondary" className="gap-1">
                <Sun className="h-3 w-3" />
                {formatRange(plantType.light_min, plantType.light_max, lightLabels)}
              </Badge>
            )}
            {plantType.watering_frequency_days && (
              <Badge variant="secondary" className="gap-1">
                <Droplets className="h-3 w-3" />
                Every {plantType.watering_frequency_days}d
              </Badge>
            )}
            {(plantType.size_min || plantType.size_max) && (
              <Badge variant="secondary" className="gap-1">
                <Ruler className="h-3 w-3" />
                {formatRange(plantType.size_min, plantType.size_max, sizeLabels)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
