import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PlantCardLoading() {
  return (
    <Card className="gap-0 h-44 overflow-hidden p-0 flex flex-row">
      <div className="relative h-full w-32 sm:w-44 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex-1 flex flex-col justify-center p-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Badge variant="secondary" className="gap-1 shrink-0 my-auto">
            <Skeleton className="h-3 w-12" />
          </Badge>
        </div>
        <div className="mt-2 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-wrap gap-2 pt-1">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}
