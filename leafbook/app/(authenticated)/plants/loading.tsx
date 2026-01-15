import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlantsLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">My Plants</h1>
          <p className="mt-1 text-muted-foreground">
            Your personal plant collection
          </p>
        </div>
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Plants grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="font-serif text-lg">
                    <Skeleton className="h-6 w-28" />
                  </CardTitle>
                  <Skeleton className="mt-1 h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
