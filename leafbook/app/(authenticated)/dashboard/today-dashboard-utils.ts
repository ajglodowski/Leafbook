export type TaskStatus = "overdue" | "due_soon" | "not_started" | "ok";

export interface PlantTask {
  plant_id: string;
  plant_name: string;
  plant_type_name: string | null;
  watering_status: TaskStatus;
  watering_frequency_days: number;
  last_watered_at: string | null;
  water_due_at: string | null;
  fertilizing_status: TaskStatus;
  fertilizing_frequency_days: number;
  last_fertilized_at: string | null;
  fertilize_due_at: string | null;
}

export interface UpcomingTask extends PlantTask {
  days_until_water: number;
}

export interface SpotlightPlant {
  id: string;
  name: string;
  nickname: string | null;
  description: string | null;
  how_acquired: string | null;
  plant_type_name: string | null;
  photo_url: string | null;
}

export interface RecentJournalEntry {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  plant_id: string;
  plant_name: string;
}

export type PlantPhoto = {
  id: string;
  plant_id: string;
  url: string;
};

export function buildPhotosByPlant(photos: PlantPhoto[] | null | undefined) {
  const photosByPlant = new Map<string, { id: string; url: string }[]>();
  photos?.forEach((photo) => {
    const existing = photosByPlant.get(photo.plant_id) || [];
    existing.push({ id: photo.id, url: photo.url });
    photosByPlant.set(photo.plant_id, existing);
  });
  return photosByPlant;
}

export function getThumbnailUrl(
  plantId: string,
  photosByPlant: Map<string, { id: string; url: string }[]>
) {
  const photos = photosByPlant.get(plantId);
  if (!photos || photos.length === 0) return null;
  return photos[0].url;
}

export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? "s" : ""} ago`;
}

export function formatJournalDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getGreeting(): { greeting: string; subtext: string } {
  const hour = new Date().getHours();

  if (hour < 6) {
    return {
      greeting: "Burning the midnight oil?",
      subtext: "Your plants are sleeping soundly.",
    };
  } else if (hour < 12) {
    return { greeting: "Good morning", subtext: "A new day to watch things grow." };
  } else if (hour < 17) {
    return {
      greeting: "Good afternoon",
      subtext: "Perfect light for a quick check-in.",
    };
  } else if (hour < 21) {
    return {
      greeting: "Good evening",
      subtext: "Time to unwind with your leafy friends.",
    };
  }
  return { greeting: "Evening", subtext: "The plants are winding down too." };
}

export function getSpotlightMessage(plant: SpotlightPlant): string {
  const messages = [
    `How's ${plant.name} doing today?`,
    `${plant.name} could use some attention`,
    `Check in on ${plant.name}`,
    `${plant.name} is waiting for you`,
    `Time for a moment with ${plant.name}?`,
  ];
  // Use plant id to get consistent message per plant
  const index = plant.id.charCodeAt(0) % messages.length;
  return messages[index];
}

export function getDaysUntilDue(dueDate: string | null): number {
  if (!dueDate) return Infinity;
  const due = new Date(dueDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
