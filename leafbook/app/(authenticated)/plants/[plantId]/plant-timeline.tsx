"use client";

import { History, BookOpen, Pencil, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JournalEntryDialog } from "./journal-entry-dialog";
import { IssueDialog } from "./issue-dialog";

// Human-friendly labels for event types with fun icons and colors
const eventConfig: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
  watered: { 
    label: "Watered", 
    emoji: "💧", 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10"
  },
  fertilized: { 
    label: "Fed some plant food", 
    emoji: "✨", 
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10"
  },
  repotted: { 
    label: "Got a new home", 
    emoji: "🪴", 
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10"
  },
  pruned: { 
    label: "Fresh haircut", 
    emoji: "✂️", 
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10"
  },
  rotated: { 
    label: "Turned around", 
    emoji: "🔄", 
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10"
  },
  misted: { 
    label: "Spa day misting", 
    emoji: "💨", 
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10"
  },
  cleaned: { 
    label: "Leaves cleaned", 
    emoji: "🧹", 
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10"
  },
  propagated: { 
    label: "Made a baby plant", 
    emoji: "🌱", 
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10"
  },
  acquired: { 
    label: "Joined the family", 
    emoji: "🎁", 
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-500/10"
  },
  other: { 
    label: "Something happened", 
    emoji: "📝", 
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10"
  },
};

// Human-friendly labels for issue types
const issueTypeLabels: Record<string, string> = {
  pest: "Unwanted visitors (pests)",
  disease: "Feeling under the weather",
  overwatering: "Too much water",
  underwatering: "Needs more water",
  sunburn: "Got a sunburn",
  etiolation: "Reaching for light",
  nutrient_deficiency: "Hungry for nutrients",
  root_rot: "Root troubles",
  dropping_leaves: "Dropping leaves",
  yellowing: "Turning yellow",
  browning: "Brown spots",
  wilting: "Looking droopy",
  other: "Other concern",
};

// Severity badge variants
const severityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; emoji: string }> = {
  low: { label: "Minor", variant: "secondary", emoji: "🟡" },
  medium: { label: "Moderate", variant: "default", emoji: "🟠" },
  high: { label: "Serious", variant: "destructive", emoji: "🔴" },
  critical: { label: "Critical", variant: "destructive", emoji: "🚨" },
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

interface CareEvent {
  id: string;
  event_type: string;
  event_date: string;
  notes: string | null;
  metadata?: {
    from_pot_id?: string | null;
    to_pot_id?: string | null;
    from_pot_name?: string | null;
    to_pot_name?: string | null;
  } | null;
}

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
}

interface PlantIssue {
  id: string;
  issue_type: string;
  severity: string;
  status: string;
  description: string | null;
  started_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

type TimelineItem =
  | { type: "event"; data: CareEvent; date: Date }
  | { type: "journal"; data: JournalEntry; date: Date }
  | { type: "issue"; data: PlantIssue; date: Date };

interface PlantTimelineProps {
  events: CareEvent[];
  journalEntries: JournalEntry[];
  issues: PlantIssue[];
  plantId: string;
  plantName: string;
}

export function PlantTimeline({
  events,
  journalEntries,
  issues,
  plantId,
  plantName,
}: PlantTimelineProps) {
  // Merge and sort timeline items by date (descending)
  const timelineItems: TimelineItem[] = [
    ...events.map((event) => ({
      type: "event" as const,
      data: event,
      date: new Date(event.event_date),
    })),
    ...journalEntries.map((entry) => ({
      type: "journal" as const,
      data: entry,
      date: new Date(entry.entry_date),
    })),
    ...issues.map((issue) => ({
      type: "issue" as const,
      data: issue,
      // Use resolved_at if resolved, otherwise started_at for sorting
      date: new Date(issue.resolved_at || issue.started_at),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (timelineItems.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <History className="h-10 w-10 text-primary/40" />
        </div>
        <h3 className="font-medium text-lg mb-1">No history yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Every great plant has a story. Start writing {plantName}&apos;s by logging care events or journal entries!
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-border via-border to-transparent" />
      
      <div className="space-y-1">
        {timelineItems.map((item, index) => {
          if (item.type === "event") {
            const config = eventConfig[item.data.event_type] || eventConfig.other;
            return (
              <div key={`event-${item.data.id}`} className="relative flex items-start gap-4 pl-10 py-3 group">
                {/* Timeline dot */}
                <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor} ring-4 ring-background transition-transform group-hover:scale-110`}>
                  <span className="text-base">{config.emoji}</span>
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(item.data.event_date)}
                    </span>
                  </div>
                  {/* Show pot info for repot events */}
                  {item.data.event_type === "repotted" && item.data.metadata && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.data.metadata.from_pot_name && item.data.metadata.to_pot_name
                        ? `${item.data.metadata.from_pot_name} → ${item.data.metadata.to_pot_name}`
                        : item.data.metadata.to_pot_name
                          ? `Moved into ${item.data.metadata.to_pot_name}`
                          : item.data.metadata.from_pot_name
                            ? `Moved from ${item.data.metadata.from_pot_name}`
                            : null}
                    </p>
                  )}
                  {item.data.notes && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {item.data.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDate(item.data.event_date)}
                  </p>
                </div>
              </div>
            );
          } else if (item.type === "journal") {
            // Journal entry
            return (
              <div key={`journal-${item.data.id}`} className="relative flex items-start gap-4 pl-10 py-3 group">
                {/* Timeline dot */}
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-4 ring-background transition-transform group-hover:scale-110">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>

                {/* Journal content */}
                <div className="flex-1 min-w-0">
                  <div className="rounded-xl border bg-gradient-to-br from-card to-primary/5 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.data.title ? (
                            <span className="font-medium text-primary">
                              {item.data.title}
                            </span>
                          ) : (
                            <span className="font-medium text-primary">
                              Journal Entry
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(item.data.entry_date)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                          {item.data.content}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground/70">
                          {formatDate(item.data.entry_date)}
                        </p>
                      </div>
                      <JournalEntryDialog
                        plantId={plantId}
                        plantName={plantName}
                        entry={{
                          id: item.data.id,
                          title: item.data.title,
                          content: item.data.content,
                          entry_date: item.data.entry_date,
                        }}
                        trigger={
                          <button className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            // Plant issue
            const issue = item.data;
            const isResolved = issue.status === "resolved";
            const issueLabel = issueTypeLabels[issue.issue_type] || "Issue";
            const severityInfo = severityConfig[issue.severity] || severityConfig.medium;
            
            return (
              <div key={`issue-${issue.id}`} className="relative flex items-start gap-4 pl-10 py-3 group">
                {/* Timeline dot */}
                <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background transition-transform group-hover:scale-110 ${
                  isResolved 
                    ? "bg-green-500/10" 
                    : "bg-orange-500/10"
                }`}>
                  {isResolved ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  )}
                </div>

                {/* Issue content */}
                <div className="flex-1 min-w-0">
                  <div className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
                    isResolved 
                      ? "bg-gradient-to-br from-card to-green-500/5" 
                      : "bg-gradient-to-br from-card to-orange-500/5 border-orange-500/30"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${
                            isResolved 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-orange-600 dark:text-orange-400"
                          }`}>
                            {isResolved && (
                              <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                            )}
                            {isResolved ? "Fixed: " : ""}{issueLabel}
                          </span>
                          <Badge variant={isResolved ? "secondary" : severityInfo.variant} className="text-xs gap-1">
                            {!isResolved && <span>{severityInfo.emoji}</span>}
                            {severityInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {isResolved && issue.resolved_at
                              ? formatTimeAgo(issue.resolved_at)
                              : formatTimeAgo(issue.started_at)}
                          </span>
                        </div>
                        {issue.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {issue.description}
                          </p>
                        )}
                        {isResolved && issue.resolution_notes && (
                          <p className="mt-2 text-sm text-green-600 dark:text-green-400 italic flex items-start gap-1">
                            <span>✓</span>
                            <span>{issue.resolution_notes}</span>
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground/70">
                          Started {formatDate(issue.started_at)}
                          {isResolved && issue.resolved_at && (
                            <> · Resolved {formatDate(issue.resolved_at)}</>
                          )}
                        </p>
                      </div>
                      <IssueDialog
                        plantId={plantId}
                        plantName={plantName}
                        issue={issue}
                        trigger={
                          <button className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
