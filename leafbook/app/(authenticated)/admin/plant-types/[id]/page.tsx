import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PlantTypeForm } from "../plant-type-form";

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 -ml-2 mb-2" 
          render={<Link href="/admin/plant-types" />}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plant types
        </Button>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Edit {plantType.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Update this plant type's information and care recommendations
        </p>
      </div>

      {/* Form */}
      <PlantTypeForm plantType={plantType} mode="edit" />
    </div>
  );
}
