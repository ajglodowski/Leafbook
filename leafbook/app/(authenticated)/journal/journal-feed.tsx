"use client";

import { BookOpen,ExternalLink, Leaf, Link2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { JournalEntryWithPlant } from "@/lib/queries/journal";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface JournalFeedProps {
  entries: JournalEntryWithPlant[];
}

export function JournalFeed({ entries }: JournalFeedProps) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={`journal-${entry.id}`} className="overflow-hidden">
          <CardContent className="pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm">
              <Link
                href={`/plants/${entry.plant.id}`}
                className="flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Leaf className="h-4 w-4" />
                {entry.plant.name}
              </Link>
              {entry.plant.plant_types && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <Link
                    href={`/plant-types/${entry.plant.plant_types.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {entry.plant.plant_types.name}
                  </Link>
                </>
              )}
              <Badge variant="outline" className="ml-auto">
                <BookOpen className="mr-1 h-3 w-3" />
                Journal
              </Badge>
            </div>

            <div className="space-y-2">
              {entry.title && (
                <h3 className="font-serif text-lg font-semibold">{entry.title}</h3>
              )}
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </p>
              {entry.event_id && (
                <Badge variant="secondary" className="mt-1 gap-1">
                  <Link2 className="h-3 w-3" />
                  Linked event
                </Badge>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <time className="text-xs text-muted-foreground">
                {formatDate(entry.entry_date)}
              </time>
              <Link
                href={`/plants/${entry.plant.id}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                View plant
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
