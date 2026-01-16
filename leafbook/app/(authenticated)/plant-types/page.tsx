import { Library, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { PlantTypeCard } from "@/components/plant-type-card";
import { PlantTypesSearch } from "./search";

// Map light enum values to numeric for filtering
const lightToNumeric: Record<string, number> = {
  dark: 1,
  low_indirect: 2,
  medium_indirect: 3,
  bright_indirect: 4,
  direct: 5,
};

// Map size enum values to numeric for filtering
const sizeToNumeric: Record<string, number> = {
  small: 1,
  medium: 2,
  large: 3,
  extra_large: 4,
};

export default async function PlantTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; light?: string; size?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build query - include primary photo
  let query = supabase
    .from("plant_types")
    .select(`
      *,
      plant_type_photos!left (
        id,
        url,
        is_primary
      )
    `)
    .order("name");

  // Apply search filter
  if (params.q) {
    query = query.or(
      `name.ilike.%${params.q}%,scientific_name.ilike.%${params.q}%,description.ilike.%${params.q}%`
    );
  }

  // Apply light filter - find plant types where the filter value is within their min/max range
  if (params.light && lightToNumeric[params.light]) {
    const numericValue = lightToNumeric[params.light];
    // Plant type matches if: light_min_numeric <= filter_value <= light_max_numeric
    query = query.lte("light_min_numeric", numericValue).gte("light_max_numeric", numericValue);
  }

  // Apply size filter - find plant types where the filter value is within their min/max range
  if (params.size && sizeToNumeric[params.size]) {
    const numericValue = sizeToNumeric[params.size];
    // Plant type matches if: size_min_numeric <= filter_value <= size_max_numeric
    query = query.lte("size_min_numeric", numericValue).gte("size_max_numeric", numericValue);
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
          {plantTypes.map((plantType) => {
            // Extract primary photo URL
            const photos = plantType.plant_type_photos || [];
            const primaryPhoto = photos.find((p: { is_primary: boolean }) => p.is_primary) || photos[0];
            const primaryPhotoUrl = primaryPhoto?.url || null;
            
            // Remove photos from plantType object for the card
            const { plant_type_photos, ...plantTypeData } = plantType;
            
            return (
              <PlantTypeCard 
                key={plantType.id} 
                plantType={plantTypeData} 
                primaryPhotoUrl={primaryPhotoUrl}
              />
            );
          })}
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
