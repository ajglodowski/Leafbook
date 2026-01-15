import Link from "next/link";
import { Droplets, Sun, Ruler } from "lucide-react";
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

export function PlantTypeCard({ plantType }: { plantType: PlantType }) {
  return (
    <Link href={`/plant-types/${plantType.id}`} className="block">
      <Card className="h-full transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
        <CardHeader>
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
