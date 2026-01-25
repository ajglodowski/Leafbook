import { GitBranch,List, Ruler, Search, Sun } from "lucide-react"

import { PlantTypeCardLoading } from "@/app/(authenticated)/plant-types/plant-type-card-loading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function PlantTypesLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Plant Types</h1>
        <p className="mt-1 text-muted-foreground">
          Browse the catalog and taxonomy for care-ready plants
        </p>
      </div>

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <Button variant="ghost" size="sm" className="gap-2 shrink-0" disabled>
            <List className="h-4 w-4" />
            Catalog
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 shrink-0" disabled>
            <GitBranch className="h-4 w-4" />
            Taxonomy
          </Button>
        </div>

        <div className="space-y-6">
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
              <PlantTypeCardLoading key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
