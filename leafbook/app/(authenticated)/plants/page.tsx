import { getCurrentUser } from "./actions";
import {
  getDueTasksForUserList as getDueTasksForUser,
  getLegacyPlantsForUser,
  getPlantPhotosForPlants,
  getPlantsForUser,
  getPlantsWithOrigin,
  getPlantTypes,
  computeOriginStats,
  getTaxonomyForUserPlants,
  buildCompactedTree,
} from "@/lib/queries/plants";
import { AddPlantDialog } from "./add-plant-dialog";
import { PlantsTabs } from "./plants-tabs";

export const metadata = {
  title: "Plants | Leafbook",
  description: "Browse and manage your plant collection",
};

export default async function PlantsPage() {
  const user = await getCurrentUser();
  const [plantsResult, legacyPlantsResult, plantTypesResult, dueTasksResult, plantsWithOriginResult, taxonomyResult] = await Promise.all([
    getPlantsForUser(user.id),
    getLegacyPlantsForUser(user.id),
    getPlantTypes(),
    getDueTasksForUser(user.id),
    getPlantsWithOrigin(user.id),
    getTaxonomyForUserPlants(user.id),
  ]);
  const plants = plantsResult.data;
  const legacyPlants = legacyPlantsResult.data;
  const plantTypes = plantTypesResult.data;
  const dueTasks = dueTasksResult.data;
  const plantsWithOrigin = plantsWithOriginResult.data;
  const taxonomyTree = buildCompactedTree(taxonomyResult.tree);

  // Compute origin stats
  const originStats = computeOriginStats(plantsWithOrigin);

  // Fetch all photos for all plants (active + legacy) for thumbnails
  const allPlantIds = [...(plants?.map(p => p.id) || []), ...(legacyPlants?.map(p => p.id) || [])];
  const { data: allPhotos } = await getPlantPhotosForPlants(allPlantIds);

  // Build a map of plant_id -> photos (ordered by taken_at desc)
  const photosByPlant = new Map<string, { id: string; url: string }[]>();
  allPhotos?.forEach(photo => {
    const existing = photosByPlant.get(photo.plant_id) || [];
    existing.push({ id: photo.id, url: photo.url });
    photosByPlant.set(photo.plant_id, existing);
  });

  if (plantsResult.error) {
    console.error("Error fetching plants:", plantsResult.error);
  }

  const hasPlants = plants && plants.length > 0;
  const totalPlants = (plants?.length || 0) + (legacyPlants?.length || 0);
  
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">My Plants</h1>
          <p className="mt-1 text-muted-foreground">
            Your personal plant collection
            {hasPlants && ` · ${plants.length} active plant${plants.length > 1 ? "s" : ""}`}
            {legacyPlants && legacyPlants.length > 0 && ` · ${legacyPlants.length} legacy`}
          </p>
        </div>
        <AddPlantDialog plantTypes={plantTypes || []} />
      </div>

      {/* Tabbed content */}
      <PlantsTabs
        plants={plants}
        legacyPlants={legacyPlants}
        plantTypes={plantTypes}
        dueTasks={dueTasks}
        photosByPlant={photosByPlant}
        originStats={originStats}
        taxonomyTree={taxonomyTree}
      />
    </div>
  );
}
