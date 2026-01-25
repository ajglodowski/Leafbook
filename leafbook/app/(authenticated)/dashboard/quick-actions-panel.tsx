import { BookOpen, Compass, Heart, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActionsPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="h-4 w-4 text-muted-foreground" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Link href="/plants?new=true" className="w-full">
          <Button variant="outline" className="w-full h-auto flex-col gap-1 py-3">
            <Plus className="h-5 w-5" />
            <span className="text-xs">Add Plant</span>
          </Button>
        </Link>
        <Link href="/plant-types" className="w-full">
          <Button variant="outline" className="w-full h-auto flex-col gap-1 py-3">
            <Compass className="h-5 w-5" />
            <span className="text-xs">Browse Catalog</span>
          </Button>
        </Link>
        <Link href="/journal" className="w-full">
          <Button variant="outline" className="w-full h-auto flex-col gap-1 py-3">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs">Journal</span>
          </Button>
        </Link>
        <Link href="/wishlist" className="w-full">
          <Button variant="outline" className="w-full h-auto flex-col gap-1 py-3">
            <Heart className="h-5 w-5" />
            <span className="text-xs">Wishlist</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
