import { Droplets } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TodayLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-muted-foreground">
          Your plants' care tasks at a glance
        </p>
      </div>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      {/* Watering section */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-medium">
          <Droplets className="h-5 w-5 text-blue-500" />
          Watering
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} size="sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      <Skeleton className="h-5 w-28" />
                    </CardTitle>
                    <Skeleton className="mt-1 h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Last: <Skeleton className="h-3 w-16" />
                </span>
                <Skeleton className="h-7 w-16 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
