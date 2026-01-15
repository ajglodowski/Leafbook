import Link from "next/link";
import { BookOpen, PenLine } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function JournalPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Journal</h1>
          <p className="mt-1 text-muted-foreground">
            Your plant stories and observations
          </p>
        </div>
        <Button disabled>
          <PenLine className="mr-1.5 h-4 w-4" />
          New entry
        </Button>
      </div>

      {/* Empty state */}
      <EmptyState
        icon={BookOpen}
        title="No journal entries yet"
        description="Write about your plants — milestones, observations, or just how they make you feel. Your journal entries become part of each plant's story."
      >
        <Button render={<Link href="/plants" />}>
          Add a plant first
        </Button>
      </EmptyState>
    </div>
  );
}
