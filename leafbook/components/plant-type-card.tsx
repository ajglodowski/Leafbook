import Link from "next/link";
import Image from "next/image";
import { Droplets, Sun, Ruler, Leaf } from "lucide-react";
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

interface PlantTypeCardProps {
  plantType: PlantType;
  primaryPhotoUrl?: string | null;
}

export function PlantTypeCard({ plantType, primaryPhotoUrl }: PlantTypeCardProps) {
  return (
    <Link href={`/plant-types/${plantType.id}`} className="block">
      <Card className="h-full overflow-hidden transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
        {/* Photo thumbnail */}
        <div className="relative aspect-4/3 w-full bg-muted">
          {primaryPhotoUrl ? (
            <Image
              src={primaryPhotoUrl}
              alt={plantType.name}
              fill
              className="object-cover"
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
            {plantType.light_requirement && (
              <Badge variant="secondary" className="gap-1">
                <Sun className="h-3 w-3" />
                {lightLabels[plantType.light_requirement] || plantType.light_requirement}
              </Badge>
            )}
            {plantType.watering_frequency_days && (
              <Badge variant="secondary" className="gap-1">
                <Droplets className="h-3 w-3" />
                Every {plantType.watering_frequency_days}d
              </Badge>
            )}
            {plantType.size_category && (
              <Badge variant="secondary" className="gap-1">
                <Ruler className="h-3 w-3" />
                {sizeLabels[plantType.size_category] || plantType.size_category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
