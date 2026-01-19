import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PlantTypeForm } from "../plant-type-form";
import { PhotoManagement } from "./photo-management";
import { WikidataEnrichment } from "./wikidata-enrichment";

export default async function EditPlantTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plantType, error } = await supabase
    .from("plant_types")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !plantType) {
    notFound();
  }

  // Fetch photos for this plant type
  const { data: photos } = await supabase
    .from("plant_type_photos")
    .select("id, url, caption, is_primary, display_order")
    .eq("plant_type_id", id)
    .order("is_primary", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link href="/admin/plant-types">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 -ml-2 mb-2" 
          >
            <ArrowLeft className="h-4 w-4" />
            Back to plant types
          </Button>
        </Link>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Edit {plantType.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Update this plant type&apos;s information and care recommendations
        </p>
      </div>

      {/* Wikidata/Wikipedia Enrichment */}
      <WikidataEnrichment plantType={plantType} />

      {/* Form */}
      <PlantTypeForm plantType={plantType} mode="edit" />

      {/* Photo Management */}
      <PhotoManagement
        plantTypeId={id}
        plantTypeName={plantType.name}
        wikipediaTitle={plantType.wikipedia_title}
        photos={photos || []}
      />
    </div>
  );
}
