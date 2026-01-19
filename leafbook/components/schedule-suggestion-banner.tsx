"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Lightbulb, ChevronRight, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { acceptScheduleSuggestion, dismissScheduleSuggestion } from "@/app/(authenticated)/plants/[plantId]/actions";

interface ScheduleSuggestion {
  id: string;
  plant_id: string;
  plant_name: string;
  suggested_interval_days: number;
  current_interval_days: number;
  confidence_score: number | null;
}

interface ScheduleSuggestionBannerProps {
  suggestions: ScheduleSuggestion[];
}

export function ScheduleSuggestionBanner({ suggestions: initialSuggestions }: ScheduleSuggestionBannerProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (suggestions.length === 0) {
    return null;
  }

  // Show the first suggestion
  const suggestion = suggestions[0];
  const remainingCount = suggestions.length - 1;
  const direction = suggestion.suggested_interval_days < suggestion.current_interval_days 
    ? "more often" 
    : "less often";

  async function handleAccept() {
    setProcessingId(suggestion.id);
    startTransition(async () => {
      const result = await acceptScheduleSuggestion(
        suggestion.id, 
        suggestion.plant_id, 
        suggestion.suggested_interval_days
      );
      if (result.success) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      }
      setProcessingId(null);
    });
  }

  async function handleDismiss() {
    setProcessingId(suggestion.id);
    startTransition(async () => {
      const result = await dismissScheduleSuggestion(suggestion.id);
      if (result.success) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      }
      setProcessingId(null);
    });
  }

  const isProcessing = isPending && processingId === suggestion.id;

  return (
    <Card className="border-purple-200/50 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-950/20">
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
            <Lightbulb className="h-4 w-4 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              <Link 
                href={`/plants/${suggestion.plant_id}`}
                className="text-purple-700 dark:text-purple-300 hover:underline"
              >
                {suggestion.plant_name}
              </Link>
              {" "}could use a schedule update
            </p>
            <p className="text-xs text-muted-foreground">
              You water {direction} ({suggestion.current_interval_days} → {suggestion.suggested_interval_days} days)
              {remainingCount > 0 && (
                <span className="ml-1">• +{remainingCount} more</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isProcessing}
            className="gap-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Check className="h-3.5 w-3.5" />
            {isProcessing ? "..." : "Update"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isProcessing}
            className="px-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <Link href={`/plants/${suggestion.plant_id}`}>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
            >
              View
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
