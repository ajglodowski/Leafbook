import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default function WishlistLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Wishlist</h1>
          <p className="mt-1 text-muted-foreground">
            Plants you'd love to add to your collection
          </p>
        </div>
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Wishlist items */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                <Skeleton className="h-6 w-28" />
              </CardTitle>
              <Skeleton className="h-4 w-24 italic" />
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
