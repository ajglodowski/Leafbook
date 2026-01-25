import {
  ArrowLeft,
  Calendar,
  Droplets,
  History,
  Home,
  Leaf,
  MapPin,
  Package,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlantDetailLoading() {
  return (
    <div className="space-y-8 pb-12">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" disabled>
        <ArrowLeft className="h-4 w-4" />
        Back to plants
      </Button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/5 via-transparent to-accent/10">
        <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
          <div className="relative mx-auto lg:mx-0 shrink-0">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-linear-to-br from-primary/20 to-accent/20 blur-sm" />
              <div className="relative h-64 w-64 sm:h-80 sm:w-80 overflow-hidden rounded-xl bg-muted ring-4 ring-background shadow-xl">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center text-center lg:text-left">
            <div className="space-y-3">
              <div>
                <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">
                  <Skeleton className="h-10 w-60 mx-auto lg:mx-0" />
                </h1>
                <Skeleton className="mt-3 h-6 w-40 mx-auto lg:mx-0" />
              </div>

              <Skeleton className="h-5 w-56 mx-auto lg:mx-0" />

              <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs">
                  <Home className="h-3.5 w-3.5 text-blue-500" />
                  <Skeleton className="h-3 w-20" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  <Skeleton className="h-3 w-16" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <Skeleton className="h-3 w-14" />
                </span>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground">
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>

        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
      </div>

      {/* Legacy banner placeholder */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-4 rounded-xl bg-muted/50 border border-muted-foreground/20">
        <Skeleton className="h-5 w-24" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>

      {/* Care status strip */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-linear-to-r from-primary/5 via-transparent to-orange-500/5 border border-primary/10">
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
          <Droplets className="h-4 w-4" />
          <Skeleton className="h-3 w-24" />
        </span>
        <div className="h-6 w-px bg-border mx-1" />
        <span className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
          <Skeleton className="h-3 w-20" />
        </span>
      </div>

      {/* Plant vitals */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-serif text-xl font-medium">Plant Vitals</h2>
          <span className="text-muted-foreground">📋</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <Calendar className="h-4 w-4 text-purple-500" />
                </div>
                Care Rhythm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Sun className="h-4 w-4 text-amber-500" />
                </div>
                Light Vibes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-orange-500/10">
                  <Package className="h-4 w-4 text-orange-500" />
                </div>
                Home Sweet Pot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <CardContent className="py-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Propagation */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Leaf className="h-5 w-5 text-primary" />
              Propagation
            </CardTitle>
            <CardDescription>Plant lineage and cuttings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      </section>

      {/* Notes */}
      <section>
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span>📝</span>
              My Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </section>

      {/* Photo gallery */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-serif text-xl font-medium">Photo Gallery</h2>
          <span className="text-muted-foreground">📸</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-serif">
                  <History className="h-5 w-5" />
                  Plant&apos;s Story
                </CardTitle>
                <CardDescription>Care events, journal entries, and adventures</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Plant type info */}
      <section>
        <Card className="relative overflow-hidden bg-linear-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Leaf className="h-5 w-5 text-primary" />
              About this plant
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-3 w-32" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
