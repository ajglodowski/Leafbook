import Link from "next/link";
import { Plus, Pencil, Trash2, Library, Droplets, Sun, Ruler, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { DeletePlantTypeButton } from "./delete-button";

// Human-friendly labels for enums
const lightLabels: Record<string, string> = {
  dark: "Dark",
  low_indirect: "Low",
  medium_indirect: "Medium",
  bright_indirect: "Bright",
  direct: "Direct",
};

const sizeLabels: Record<string, string> = {
  small: "S",
  medium: "M",
  large: "L",
  extra_large: "XL",
};

export default async function AdminPlantTypesPage() {
  const supabase = await createClient();

  const { data: plantTypes, error } = await supabase
    .from("plant_types")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching plant types:", error);
  }

  const hasPlantTypes = plantTypes && plantTypes.length > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Plant Types</h2>
          <p className="text-sm text-muted-foreground">
            {hasPlantTypes 
              ? `${plantTypes.length} plant type${plantTypes.length !== 1 ? "s" : ""} in catalog`
              : "Manage the plant catalog"}
          </p>
        </div>
        <Button render={<Link href="/admin/plant-types/new" />} className="gap-1">
          <Plus className="h-4 w-4" />
          Add plant type
        </Button>
      </div>

      {/* Plant types list */}
      {hasPlantTypes ? (
        <div className="space-y-3">
          {plantTypes.map((plantType) => (
            <Card key={plantType.id} size="sm">
              <CardContent className="flex items-center gap-4 py-4">
                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{plantType.name}</h3>
                    {plantType.scientific_name && (
                      <span className="text-sm text-muted-foreground italic truncate hidden sm:inline">
                        {plantType.scientific_name}
                      </span>
                    )}
                  </div>
                  {plantType.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {plantType.description}
                    </p>
                  )}
                </div>

                {/* Care badges */}
                <div className="hidden md:flex items-center gap-2">
                  {plantType.light_requirement && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Sun className="h-3 w-3" />
                      {lightLabels[plantType.light_requirement]}
                    </Badge>
                  )}
                  {plantType.watering_frequency_days && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Droplets className="h-3 w-3" />
                      {plantType.watering_frequency_days}d
                    </Badge>
                  )}
                  {plantType.fertilizing_frequency_days && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Sparkles className="h-3 w-3" />
                      {plantType.fertilizing_frequency_days}d
                    </Badge>
                  )}
                  {plantType.size_category && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Ruler className="h-3 w-3" />
                      {sizeLabels[plantType.size_category]}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    render={<Link href={`/admin/plant-types/${plantType.id}`} />}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeletePlantTypeButton 
                    plantTypeId={plantType.id} 
                    plantTypeName={plantType.name} 
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Library}
          title="No plant types yet"
          description="Start building your catalog by adding plant types with care recommendations."
        >
          <Button render={<Link href="/admin/plant-types/new" />} className="gap-1">
            <Plus className="h-4 w-4" />
            Add first plant type
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
