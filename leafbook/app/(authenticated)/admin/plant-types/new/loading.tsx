import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPlantTypeNewLoading() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" disabled>
        <ArrowLeft className="h-4 w-4" />
        Back to plant types
      </Button>

      {/* Page header */}
      <h2 className="font-serif text-2xl font-semibold tracking-tight">Add Plant Type</h2>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>Plant Details</CardTitle>
          <CardDescription>
            Add a new plant type to the catalog with care recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name field */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          {/* Scientific name field */}
          <div className="space-y-2">
            <Label>Scientific name</Label>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          {/* Description field */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          {/* Two column fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Light requirement</Label>
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Size category</Label>
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Watering frequency (days)</Label>
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Fertilizing frequency (days)</Label>
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
          {/* Submit button */}
          <div className="flex justify-end">
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
