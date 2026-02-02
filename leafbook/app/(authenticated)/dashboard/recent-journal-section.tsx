import { BookOpen, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPlantPhotosForPlants } from "@/lib/queries/plants";

import { getDashboardJournalEntries } from "./today-dashboard-data";
import {
  buildPhotosByPlant,
  formatJournalDate,
  getThumbnailUrl,
  type RecentJournalEntry,
} from "./today-dashboard-utils";

export async function RecentJournalSection({ userId }: { userId: string }) {
  const { data: journalEntries } = await getDashboardJournalEntries(userId);

  const recentJournal: RecentJournalEntry[] = (journalEntries || []).map((entry) => {
    const plant = Array.isArray(entry.plants) ? entry.plants[0] : entry.plants;
    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      entry_date: entry.entry_date,
      plant_id: entry.plant_id,
      plant_name: plant?.name || "Unknown",
    };
  });

  if (recentJournal.length === 0) {
    return null;
  }

  const plantIds = Array.from(
    new Set(recentJournal.map((entry) => entry.plant_id).filter(Boolean))
  );
  const { data: plantPhotos } = await getPlantPhotosForPlants(plantIds);
  const photosByPlant = buildPhotosByPlant(plantPhotos);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          Recent Journal Entries
        </h2>
        <Link href="/journal">
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {recentJournal.map((entry) => {
          const thumbnailUrl = getThumbnailUrl(entry.plant_id, photosByPlant);
          return (
            <Card key={entry.id} className="group">
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Link href={`/plants/${entry.plant_id}`} className="shrink-0">
                      {thumbnailUrl ? (
                        <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={thumbnailUrl}
                            alt={entry.plant_name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Leaf className="h-5 w-5" />
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Link
                          href={`/plants/${entry.plant_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {entry.plant_name}
                        </Link>
                        <span className="text-muted-foreground">·</span>
                        <time className="text-muted-foreground">
                          {formatJournalDate(entry.entry_date)}
                        </time>
                      </div>
                      {entry.title && (
                        <p className="mt-1 font-serif font-medium">{entry.title}</p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                  <Link href={`/plants/${entry.plant_id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
          </Card>
          );
        })}
      </div>
    </section>
  );
}
