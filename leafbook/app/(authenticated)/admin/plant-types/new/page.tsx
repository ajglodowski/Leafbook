import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlantTypeForm } from "../plant-type-form";

export default function NewPlantTypePage() {
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
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Add Plant Type</h2>
        <p className="text-sm text-muted-foreground">
          Add a new plant type to the catalog
        </p>
      </div>

      {/* Form */}
      <PlantTypeForm mode="create" />
    </div>
  );
}
