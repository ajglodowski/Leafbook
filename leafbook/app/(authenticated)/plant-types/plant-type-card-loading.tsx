import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PlantTypeCardLoading() {
  return (
    <Card className="h-full pt-0 overflow-hidden transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
      <div className="relative aspect-square w-full">
        <Skeleton className="h-full w-full rounded-b-2xl" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-lg">
          <Skeleton className="h-5 w-32" />
        </CardTitle>
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
