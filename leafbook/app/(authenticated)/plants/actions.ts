"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPlant(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const name = formData.get("name") as string;
  const plantTypeId = formData.get("plantTypeId") as string | null;
  const isIndoor = formData.get("isIndoor") === "true";
  const location = formData.get("location") as string | null;

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const { data: plant, error } = await supabase
    .from("plants")
    .insert({
      user_id: user.id,
      name: name.trim(),
      plant_type_id: plantTypeId || null,
      is_indoor: isIndoor,
      location: location?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating plant:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/plants");
  revalidatePath("/today");
  
  return { success: true, plantId: plant.id };
}

export async function logCareEvent(
  plantId: string, 
  eventType: "watered" | "fertilized" | "repotted"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("plant_events")
    .insert({
      plant_id: plantId,
      user_id: user.id,
      event_type: eventType,
      event_date: new Date().toISOString(),
    });

  if (error) {
    console.error("Error logging care event:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/today");
  revalidatePath("/plants");
  revalidatePath(`/plants/${plantId}`);
  
  return { success: true };
}
