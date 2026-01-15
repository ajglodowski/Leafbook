import { Library, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { PlantTypeCard } from "@/components/plant-type-card";
import { PlantTypesSearch } from "./search";

export default async function PlantTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; light?: string; size?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("plant_types")
    .select("*")
    .order("name");

  // Apply search filter
  if (params.q) {
    query = query.or(
      `name.ilike.%${params.q}%,scientific_name.ilike.%${params.q}%,description.ilike.%${params.q}%`
    );
  }

  // Apply light filter
  if (params.light) {
    query = query.eq("light_requirement", params.light);
  }

  // Apply size filter
  if (params.size) {
    query = query.eq("size_category", params.size);
  }

  const { data: plantTypes, error } = await query;

  if (error) {
    console.error("Error fetching plant types:", error);
  }

  const hasFilters = params.q || params.light || params.size;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Plant Catalog</h1>
        <p className="mt-1 text-muted-foreground">
          Discover plants and their recommended care
        </p>
      </div>

      {/* Search and filters */}
      <PlantTypesSearch />

      {/* Results */}
      {plantTypes && plantTypes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plantTypes.map((plantType) => (
            <PlantTypeCard key={plantType.id} plantType={plantType} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Library}
          title={hasFilters ? "No plants match your search" : "No plants in catalog yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Check back soon — we're building a curated collection of plant types with care recommendations."
          }
        />
      )}
    </div>
  );
}
