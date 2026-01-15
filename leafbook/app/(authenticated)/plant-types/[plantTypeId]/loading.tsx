import { ArrowLeft, Droplets, Sun, Ruler, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlantTypeDetailLoading() {
  return (
    <div className="space-y-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" disabled>
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            <Skeleton className="h-9 w-48" />
          </h1>
          <Skeleton className="mt-2 h-6 w-36 italic" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>

      {/* Care recommendations */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Light */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-5 w-5 text-amber-500" />
              Light
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-32" />
          </CardContent>
        </Card>

        {/* Watering */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplets className="h-5 w-5 text-blue-500" />
              Watering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-1 h-4 w-36" />
          </CardContent>
        </Card>

        {/* Fertilizing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-green-500" />
              Fertilizing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-1 h-4 w-32" />
          </CardContent>
        </Card>

        {/* Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler className="h-5 w-5 text-purple-500" />
              Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-1 h-4 w-44" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
