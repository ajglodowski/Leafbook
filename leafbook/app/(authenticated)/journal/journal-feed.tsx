"use client";

import { AlertTriangle, BookOpen, CheckCircle,ExternalLink, Leaf } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { JournalEntryWithPlant, PlantIssueWithPlant } from "@/lib/queries/journal";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Human-friendly labels for issue types
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

// Severity badge variants
const severityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "High", variant: "destructive" },
  critical: { label: "Critical", variant: "destructive" },
};

type FeedItem =
  | { type: "journal"; data: JournalEntryWithPlant; date: Date }
  | { type: "issue"; data: PlantIssueWithPlant; date: Date };

interface JournalFeedProps {
  entries: JournalEntryWithPlant[];
  issues: PlantIssueWithPlant[];
}

export function JournalFeed({ entries, issues }: JournalFeedProps) {
  // Merge and sort all items by date (descending)
  const feedItems: FeedItem[] = [
    ...entries.map((entry) => ({
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

  return (
    <div className="space-y-4">
      {feedItems.map((item) => {
        if (item.type === "journal") {
          const entry = item.data;
          return (
            <Card key={`journal-${entry.id}`} className="overflow-hidden">
              <CardContent className="pt-4">
                {/* Plant info header */}
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

                {/* Entry content */}
                <div className="space-y-2">
                  {entry.title && (
                    <h3 className="font-serif text-lg font-semibold">{entry.title}</h3>
                  )}
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                </div>

                {/* Footer */}
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
          );
        } else {
          // Issue card
          const issue = item.data;
          const isResolved = issue.status === "resolved";
          const issueLabel = issueTypeLabels[issue.issue_type] || "Issue";
          const severityInfo = severityConfig[issue.severity] || severityConfig.medium;

          return (
            <Card
              key={`issue-${issue.id}`}
              className={`overflow-hidden ${
                isResolved ? "" : "border-orange-500/30 dark:border-orange-500/40"
              }`}
            >
              <CardContent className="pt-4">
                {/* Plant info header */}
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <Link
                    href={`/plants/${issue.plant.id}`}
                    className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Leaf className="h-4 w-4" />
                    {issue.plant.name}
                  </Link>
                  {issue.plant.plant_types && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <Link
                        href={`/plant-types/${issue.plant.plant_types.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {issue.plant.plant_types.name}
                      </Link>
                    </>
                  )}
                  <Badge
                    variant={isResolved ? "secondary" : "outline"}
                    className={`ml-auto ${
                      isResolved ? "" : "border-orange-500/50 text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {isResolved ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertTriangle className="mr-1 h-3 w-3" />
                    )}
                    Issue
                  </Badge>
                </div>

                {/* Issue content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`font-serif text-lg font-semibold ${
                        isResolved 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-orange-600 dark:text-orange-400"
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

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <time className="text-xs text-muted-foreground">
                    Started {formatDate(issue.started_at)}
                    {isResolved && issue.resolved_at && (
                      <> · Resolved {formatDate(issue.resolved_at)}</>
                    )}
                  </time>
                  <Link
                    href={`/plants/${issue.plant.id}`}
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
      })}
    </div>
  );
}
