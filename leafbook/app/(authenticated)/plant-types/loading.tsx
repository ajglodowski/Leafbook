import { Search, Sun, Ruler } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function PlantTypesLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Plant Catalog</h1>
        <p className="mt-1 text-muted-foreground">
          Discover plants and their recommended care
        </p>
      </div>

      {/* Search and filters - render actual UI structure */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plants..."
            className="pl-9"
            disabled
          />
        </div>
        <div className="flex h-9 w-full items-center gap-2 rounded-lg border bg-background px-3 sm:w-[180px]">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">All light levels</span>
        </div>
        <div className="flex h-9 w-full items-center gap-2 rounded-lg border bg-background px-3 sm:w-[140px]">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">All sizes</span>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-full">
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <Skeleton className="h-4 w-28 italic" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
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
        ))}
      </div>
    </div>
  )
}
