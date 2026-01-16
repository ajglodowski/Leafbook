"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlantTypeForm } from "../plant-type-form";
import { WikidataSearch } from "./wikidata-search";

interface WikidataData {
  name: string;
  scientificName: string | null;
  description: string | null;
  qid: string;
  wikipediaTitle: string | null;
}

export default function NewPlantTypePage() {
  const [wikidataData, setWikidataData] = useState<WikidataData | null>(null);
  const [formKey, setFormKey] = useState(0);

  function handleWikidataSelect(data: WikidataData) {
    setWikidataData(data);
    // Increment key to force form re-render with new initial values
    setFormKey((k) => k + 1);
  }

  // Create a partial plant type object to pass to the form
  const initialPlantType = wikidataData
    ? {
        id: "",
        name: wikidataData.name,
        scientific_name: wikidataData.scientificName,
        description: wikidataData.description,
        light_requirement: null,
        watering_frequency_days: null,
        fertilizing_frequency_days: null,
        size_category: null,
        care_notes: null,
        created_at: "",
        updated_at: "",
        // Wikidata fields to be set after creation
        wikidata_qid: wikidataData.qid,
        wikipedia_title: wikidataData.wikipediaTitle,
      }
    : undefined;

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

      {/* Wikidata Search */}
      <WikidataSearch onSelect={handleWikidataSelect} />

      {/* Form */}
      <PlantTypeForm 
        key={formKey} 
        mode="create" 
        plantType={initialPlantType as any}
        wikidataQid={wikidataData?.qid}
        wikipediaTitle={wikidataData?.wikipediaTitle}
      />
    </div>
  );
}
