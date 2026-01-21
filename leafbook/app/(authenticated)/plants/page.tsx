import { getCurrentUser } from "./actions";
import {
  getDueTasksForUserList as getDueTasksForUser,
  getPlantPhotosForPlants,
  getPlantsForUser,
  getPlantsWithOrigin,
  getPlantTypes,
  computeOriginStats,
} from "@/lib/queries/plants";
import { AddPlantDialog } from "./add-plant-dialog";
import { PlantsTabs } from "./plants-tabs";

export default async function PlantsPage() {
  const user = await getCurrentUser();
  const [plantsResult, plantTypesResult, dueTasksResult, plantsWithOriginResult] = await Promise.all([
    getPlantsForUser(user.id),
    getPlantTypes(),
    getDueTasksForUser(user.id),
    getPlantsWithOrigin(user.id),
  ]);
  const plants = plantsResult.data;
  const plantTypes = plantTypesResult.data;
  const dueTasks = dueTasksResult.data;
  const plantsWithOrigin = plantsWithOriginResult.data;

  // Compute origin stats
  const originStats = computeOriginStats(plantsWithOrigin);

  // Fetch all photos for the user's plants (for thumbnails)
  const plantIds = plants?.map(p => p.id) || [];
  const { data: allPhotos } = await getPlantPhotosForPlants(plantIds);

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
  
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">My Plants</h1>
          <p className="mt-1 text-muted-foreground">
            Your personal plant collection
            {hasPlants && ` · ${plants.length} plant${plants.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <AddPlantDialog plantTypes={plantTypes || []} />
      </div>

      {/* Tabbed content */}
      <PlantsTabs
        plants={plants}
        plantTypes={plantTypes}
        dueTasks={dueTasks}
        photosByPlant={photosByPlant}
        originStats={originStats}
      />
    </div>
  );
}
