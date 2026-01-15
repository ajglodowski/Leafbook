import Link from "next/link";
import { Leaf, Plus, Home, TreePine, Droplets, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddPlantDialog } from "./add-plant-dialog";

export default async function PlantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's plants with plant type info and due task info
  const { data: plants, error } = await supabase
    .from("plants")
    .select(`
      id,
      name,
      nickname,
      is_indoor,
      location,
      is_active,
      created_at,
      plant_type_id,
      plant_types (
        id,
        name,
        scientific_name
      )
    `)
    .eq("user_id", user!.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Fetch due task statuses
  const { data: dueTasks } = await supabase
    .from("v_plant_due_tasks")
    .select("plant_id, watering_status, fertilizing_status")
    .eq("user_id", user!.id);

  // Create a map for quick lookup
  const dueTaskMap = new Map(
    dueTasks?.map(task => [task.plant_id, task]) || []
  );

  if (error) {
    console.error("Error fetching plants:", error);
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
        <AddPlantDialog />
      </div>

      {/* Plants grid */}
      {hasPlants ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => {
            const plantType = plant.plant_types;
            const taskStatus = dueTaskMap.get(plant.id);
            const needsWater = taskStatus?.watering_status === "overdue" || taskStatus?.watering_status === "due_soon";
            const needsFertilizer = taskStatus?.fertilizing_status === "overdue" || taskStatus?.fertilizing_status === "due_soon";

            return (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <Card className="h-full transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-serif text-lg">{plant.name}</CardTitle>
                        {plant.nickname && (
                          <CardDescription>"{plant.nickname}"</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        {plant.is_indoor ? (
                          <>
                            <Home className="h-3 w-3" />
                            Indoor
                          </>
                        ) : (
                          <>
                            <TreePine className="h-3 w-3" />
                            Outdoor
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {plantType && (
                      <p className="text-sm text-muted-foreground">
                        {plantType.name}
                        {plantType.scientific_name && (
                          <span className="italic"> · {plantType.scientific_name}</span>
                        )}
                      </p>
                    )}
                    {plant.location && (
                      <p className="text-sm text-muted-foreground">{plant.location}</p>
                    )}
                    
                    {/* Care status indicators */}
                    {(needsWater || needsFertilizer) && (
                      <div className="flex gap-2 pt-1">
                        {needsWater && (
                          <Badge 
                            variant={taskStatus?.watering_status === "overdue" ? "destructive" : "outline"}
                            className="gap-1"
                          >
                            <Droplets className="h-3 w-3" />
                            {taskStatus?.watering_status === "overdue" ? "Needs water" : "Water soon"}
                          </Badge>
                        )}
                        {needsFertilizer && (
                          <Badge 
                            variant={taskStatus?.fertilizing_status === "overdue" ? "destructive" : "outline"}
                            className="gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            {taskStatus?.fertilizing_status === "overdue" ? "Needs fertilizer" : "Fertilize soon"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Leaf}
          title="No plants yet"
          description="Start building your collection! Add a plant from the catalog or create one with a custom name."
        >
          <div className="flex gap-3">
            <Button variant="outline" render={<Link href="/plant-types" />}>
              Browse catalog
            </Button>
            <AddPlantDialog />
          </div>
        </EmptyState>
      )}
    </div>
  );
}
