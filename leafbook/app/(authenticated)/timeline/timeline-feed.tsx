"use client";

import { AlertTriangle, BookOpen, CheckCircle, ExternalLink, History, Leaf, Pencil } from "lucide-react";
import Link from "next/link";

import { JournalEntryDialog } from "@/app/(authenticated)/plants/[plantId]/journal-entry-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
  TimelineEvent,
  TimelineIssue,
  TimelineJournalEntry,
} from "@/lib/queries/timeline";

const eventConfig: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
  watered: {
    label: "Watered",
    emoji: "💧",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  fertilized: {
    label: "Fed some plant food",
    emoji: "✨",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  repotted: {
    label: "Got a new home",
    emoji: "🪴",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  moved: {
    label: "Moved locations",
    emoji: "📦",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  pruned: {
    label: "Fresh haircut",
    emoji: "✂️",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
  },
  rotated: {
    label: "Turned around",
    emoji: "🔄",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  misted: {
    label: "Spa day misting",
    emoji: "💨",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  cleaned: {
    label: "Leaves cleaned",
    emoji: "🧹",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10",
  },
  propagated: {
    label: "Made a baby plant",
    emoji: "🌱",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  acquired: {
    label: "Joined the family",
    emoji: "🎁",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  legacy: {
    label: "Marked as legacy",
    emoji: "🕊️",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500/10",
  },
  restored: {
    label: "Restored from legacy",
    emoji: "🌿",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  other: {
    label: "Something happened",
    emoji: "📝",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10",
  },
};

const issueTypeLabels: Record<string, string> = {
  pest: "Pests",
  disease: "Disease",
  overwatering: "Overwatering",
  underwatering: "Underwatering",
  sunburn: "Sunburn",
  etiolation: "Stretching/Etiolation",
  nutrient_deficiency: "Nutrient Deficiency",
  root_rot: "Root Rot",
  dropping_leaves: "Dropping Leaves",
  yellowing: "Yellowing",
  browning: "Browning",
  wilting: "Wilting",
  other: "Other Issue",
};

const severityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "High", variant: "destructive" },
  critical: { label: "Critical", variant: "destructive" },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? "s" : ""} ago`;
}

type TimelineItem =
  | { type: "event"; data: TimelineEvent; date: Date }
  | { type: "journal"; data: TimelineJournalEntry; date: Date }
  | { type: "issue"; data: TimelineIssue; date: Date };

interface TimelineFeedProps {
  events: TimelineEvent[];
  entries: TimelineJournalEntry[];
  issues: TimelineIssue[];
}

export function TimelineFeed({ events, entries, issues }: TimelineFeedProps) {
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const eventsByPlant = new Map<string, TimelineEvent[]>();
  events.forEach((event) => {
    const existing = eventsByPlant.get(event.plant_id) || [];
    existing.push(event);
    eventsByPlant.set(event.plant_id, existing);
  });

  const items: TimelineItem[] = [
    ...events.map((event) => ({
      type: "event" as const,
      data: event,
      date: new Date(event.event_date),
    })),
    ...entries.map((entry) => ({
      type: "journal" as const,
      data: entry,
      date: new Date(entry.entry_date),
    })),
    ...issues.map((issue) => ({
      type: "issue" as const,
      data: issue,
      date: new Date(issue.resolved_at || issue.started_at),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4">
      {items.map((item) => {
        if (item.type === "event") {
          const event = item.data;
          const config = eventConfig[event.event_type] || eventConfig.other;
          const moveMetadata = event.event_type === "moved"
            ? (event.metadata as { from_location?: string | null; to_location?: string | null } | null)
            : null;
          const plant = event.plant;
          return (
            <Card key={`event-${event.id}`} className="overflow-hidden">
              <CardContent className="pt-4">
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <Link
                    href={`/plants/${plant.id}`}
                    className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Leaf className="h-4 w-4" />
                    {plant.name}
                  </Link>
                  {plant.plant_types && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <Link
                        href={`/plant-types/${plant.plant_types.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {plant.plant_types.name}
                      </Link>
                    </>
                  )}
                  <Badge variant="outline" className="ml-auto">
                    <History className="mr-1 h-3 w-3" />
                    Event
                  </Badge>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${config.bgColor}`}>
                    <span className="text-base">{config.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-medium ${config.color}`}>{config.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(event.event_date)}
                      </span>
                    </div>
                    {moveMetadata && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {moveMetadata.from_location && moveMetadata.to_location
                          ? `${moveMetadata.from_location} → ${moveMetadata.to_location}`
                          : moveMetadata.to_location
                            ? `Moved to ${moveMetadata.to_location}`
                            : moveMetadata.from_location
                              ? `Moved from ${moveMetadata.from_location}`
                              : null}
                      </p>
                    )}
                    {event.notes && (
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {event.notes}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      {formatDate(event.event_date)}
                    </p>
                  </div>
                  <JournalEntryDialog
                    plantId={plant.id}
                    plantName={plant.name}
                    availableEvents={eventsByPlant.get(event.plant_id) || []}
                    defaultEventId={event.id}
                    trigger={
                      <button className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          );
        }

        if (item.type === "journal") {
          const entry = item.data;
          const plant = entry.plant;
          const linkedEvent = entry.event_id ? eventsById.get(entry.event_id) : null;
          const linkedLabel = linkedEvent
            ? eventConfig[linkedEvent.event_type]?.label || "Event"
            : null;

          return (
            <Card key={`journal-${entry.id}`} className="overflow-hidden">
              <CardContent className="pt-4">
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <Link
                    href={`/plants/${plant.id}`}
                    className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Leaf className="h-4 w-4" />
                    {plant.name}
                  </Link>
                  {plant.plant_types && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <Link
                        href={`/plant-types/${plant.plant_types.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {plant.plant_types.name}
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
                  {linkedLabel && (
                    <Badge variant="secondary" className="mt-1">
                      Linked to {linkedLabel}
                    </Badge>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <time className="text-xs text-muted-foreground">
                    {formatDate(entry.entry_date)}
                  </time>
                  <Link
                    href={`/plants/${plant.id}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    View plant
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        }

        const issue = item.data;
        const plant = issue.plant;
        const isResolved = issue.status === "resolved";
        const issueLabel = issueTypeLabels[issue.issue_type] || "Issue";
        const severityInfo = severityConfig[issue.severity] || severityConfig.medium;

        return (
          <Card
            key={`issue-${issue.id}`}
            className={`overflow-hidden ${isResolved ? "" : "border-orange-500/30 dark:border-orange-500/40"}`}
          >
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center gap-2 text-sm">
                <Link
                  href={`/plants/${plant.id}`}
                  className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Leaf className="h-4 w-4" />
                  {plant.name}
                </Link>
                {plant.plant_types && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <Link
                      href={`/plant-types/${plant.plant_types.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {plant.plant_types.name}
                    </Link>
                  </>
                )}
                <Badge
                  variant={isResolved ? "secondary" : "outline"}
                  className={`ml-auto ${isResolved ? "" : "border-orange-500/50 text-orange-600 dark:text-orange-400"}`}
                >
                  {isResolved ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <AlertTriangle className="mr-1 h-3 w-3" />
                  )}
                  Issue
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`font-serif text-lg font-semibold ${
                      isResolved ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {isResolved ? "Resolved: " : ""}
                    {issueLabel}
                  </h3>
                  <Badge variant={isResolved ? "secondary" : severityInfo.variant}>
                    {severityInfo.label}
                  </Badge>
                </div>
                {issue.description && (
                  <p className="text-muted-foreground">{issue.description}</p>
                )}
                {isResolved && issue.resolution_notes && (
                  <p className="text-sm text-green-600 dark:text-green-400 italic">
                    Fixed: {issue.resolution_notes}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <time className="text-xs text-muted-foreground">
                  Started {formatDate(issue.started_at)}
                  {isResolved && issue.resolved_at && (
                    <> · Resolved {formatDate(issue.resolved_at)}</>
                  )}
                </time>
                <Link
                  href={`/plants/${plant.id}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  View plant
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
