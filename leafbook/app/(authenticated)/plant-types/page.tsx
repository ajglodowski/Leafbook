import { Library } from "lucide-react";
import Link from "next/link";

import { PlantTypeCard } from "@/app/(authenticated)/plant-types/plant-type-card";
import { EmptyState } from "@/components/common/empty-state";
import {
  buildCompactedPlantTypeTree,
  getPlantTypesWithPhotos,
  getTaxonomyForPlantTypes,
} from "@/lib/queries/plant-types";

import { PlantTypesTabs } from "./plant-types-tabs";
import { PlantTypesSearch } from "./search";

export const metadata = {
  title: "Catalog | Leafbook",
  description: "Explore the plant type catalog",
};

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
  searchParams: Promise<{ q?: string; light?: string; size?: string; page?: string }>;
}) {
  const params = await searchParams;

  // Build filter params
  const lightNumeric = params.light ? lightToNumeric[params.light] : undefined;
  const sizeNumeric = params.size ? sizeToNumeric[params.size] : undefined;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 12;

  const [{ data: plantTypes, error, count }, taxonomyResult] = await Promise.all([
    getPlantTypesWithPhotos({
      q: params.q,
      lightNumeric,
      sizeNumeric,
      page,
      pageSize,
    }),
    getTaxonomyForPlantTypes(),
  ]);

  if (error) {
    console.error("Error fetching plant types:", error);
  }

  if (taxonomyResult.error) {
    console.error("Error fetching plant taxonomy:", taxonomyResult.error);
  }

  const taxonomyTree = buildCompactedPlantTypeTree(taxonomyResult.tree);

  const hasFilters = params.q || params.light || params.size;
  const totalPages = count ? Math.max(1, Math.ceil(count / pageSize)) : 1;
  const paginationParams = new URLSearchParams();
  if (params.q) paginationParams.set("q", params.q);
  if (params.light) paginationParams.set("light", params.light);
  if (params.size) paginationParams.set("size", params.size);
  const buildPageUrl = (nextPage: number) => {
    const nextParams = new URLSearchParams(paginationParams);
    if (nextPage > 1) {
      nextParams.set("page", String(nextPage));
    }
    const query = nextParams.toString();
    return query ? `/plant-types?${query}` : "/plant-types";
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Plant Types</h1>
        <p className="mt-1 text-muted-foreground">
          Browse the catalog and taxonomy for care-ready plants
        </p>
      </div>

      <PlantTypesTabs
        catalogContent={(
          <div className="space-y-6">
            {/* Search and filters */}
            <PlantTypesSearch />

            {/* Results */}
            {plantTypes && plantTypes.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {plantTypes.map((plantType) => {
                    // Extract primary photo URL
                    const { plant_type_photos: plantTypePhotos, ...plantTypeData } = plantType;
                    const photos = plantTypePhotos || [];
                    const primaryPhoto =
                      photos.find((p: { is_primary: boolean }) => p.is_primary) || photos[0];
                    const primaryPhotoUrl = primaryPhoto?.url || null;

                    return (
                      <PlantTypeCard
                        key={plantType.id}
                        plantType={plantTypeData}
                        primaryPhotoUrl={primaryPhotoUrl}
                      />
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <Link
                      href={buildPageUrl(page - 1)}
                      className={`text-sm font-medium ${page <= 1 ? "pointer-events-none text-muted-foreground" : "text-primary"}`}
                      aria-disabled={page <= 1}
                    >
                      Previous
                    </Link>
                    <span className="rounded-md border bg-muted px-3 py-1 text-sm font-semibold text-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Link
                      href={buildPageUrl(page + 1)}
                      className={`text-sm font-medium ${page >= totalPages ? "pointer-events-none text-muted-foreground" : "text-primary"}`}
                      aria-disabled={page >= totalPages}
                    >
                      Next
                    </Link>
                  </div>
                )}
              </>
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
        )}
        taxonomyTree={taxonomyTree}
      />
    </div>
  );
}
