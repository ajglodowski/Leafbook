import { ArrowLeft, Home, Sun, Calendar, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PlantDetailLoading() {
  return (
    <div className="space-y-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" disabled>
        <ArrowLeft className="h-4 w-4" />
        Back to plants
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            <Skeleton className="h-9 w-48" />
          </h1>
          <Skeleton className="mt-2 h-5 w-36" />
        </div>
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>

      {/* Quick care actions placeholder */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-center gap-3 pt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </CardContent>
      </Card>

      {/* Environment & Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Environment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-5 w-5 text-blue-500" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-1 h-4 w-32" />
          </CardContent>
        </Card>

        {/* Light */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-5 w-5 text-amber-500" />
              Light
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-28" />
          </CardContent>
        </Card>

        {/* Care Schedule */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-purple-500" />
              Care Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>

      {/* Care History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Care History
          </CardTitle>
          <CardDescription>
            Recent care events for this plant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
