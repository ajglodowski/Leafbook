"use client";

import { Check, Droplets,Lightbulb, TrendingUp, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card";

import { acceptScheduleSuggestion, dismissScheduleSuggestion } from "./actions";

interface ScheduleSuggestionCardProps {
  suggestionId: string;
  plantId: string;
  plantName: string;
  currentIntervalDays: number;
  suggestedIntervalDays: number;
  confidenceScore: number | null;
}

export function ScheduleSuggestionCard({
  suggestionId,
  plantId,
  plantName,
  currentIntervalDays,
  suggestedIntervalDays,
  confidenceScore,
}: ScheduleSuggestionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isAccepted, setIsAccepted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if already handled
  if (isAccepted || isDismissed) {
    return null;
  }

  const direction = suggestedIntervalDays < currentIntervalDays ? "more often" : "less often";
  const confidenceLabel = confidenceScore && confidenceScore >= 80 
    ? "High confidence" 
    : confidenceScore && confidenceScore >= 60 
      ? "Good confidence" 
      : "Based on your pattern";

  async function handleAccept() {
    startTransition(async () => {
      const result = await acceptScheduleSuggestion(suggestionId, plantId, suggestedIntervalDays);
      if (result.success) {
        setIsAccepted(true);
      }
    });
  }

  async function handleDismiss() {
    startTransition(async () => {
      const result = await dismissScheduleSuggestion(suggestionId);
      if (result.success) {
        setIsDismissed(true);
      }
    });
  }

  return (
    <Card className="relative overflow-hidden border-purple-200/50 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-950/20">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <Lightbulb className="h-4 w-4 text-purple-500" />
          </div>
          Schedule Suggestion
          {confidenceScore && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {confidenceLabel}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Based on your watering history for {plantName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span>Current: every <strong>{currentIntervalDays}</strong> days</span>
          </div>
          <TrendingUp className="h-4 w-4 text-purple-500" />
          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
            <span>Suggested: every <strong>{suggestedIntervalDays}</strong> days</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          You tend to water {direction} than your current schedule. Would you like to update it?
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isPending}
            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Check className="h-4 w-4" />
            {isPending ? "Updating..." : "Update Schedule"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isPending}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
