import Image from "next/image";
import Link from "next/link";
import { Package, Droplet, Ruler, Palette, ArchiveRestore, Leaf, CheckCircle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PotDialog } from "./pot-dialog";
import { PotActions } from "./pot-actions";
import { getPotsWithUsage, type PotWithUsage } from "./actions";

export const metadata = {
  title: "Pots | Leafbook",
  description: "Manage your pot inventory",
};

export default async function PotsPage() {
  const pots = await getPotsWithUsage(true);

  // Categorize pots
  const availablePots = pots.filter((p) => !p.is_retired && !p.in_use);
  const inUsePots = pots.filter((p) => !p.is_retired && p.in_use);
  const retiredPots = pots.filter((p) => p.is_retired);
  const hasPots = pots.length > 0;

  // Stats
  const totalActive = availablePots.length + inUsePots.length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Pots</h1>
          <p className="mt-1 text-muted-foreground">
            Your pot collection for repotting plants
          </p>
        </div>
        <PotDialog />
      </div>

      {/* Inventory summary */}
      {hasPots && (
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm">
            <Package className="h-3.5 w-3.5" />
            {totalActive} active pot{totalActive !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-sm text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
            <CheckCircle className="h-3.5 w-3.5" />
            {availablePots.length} available
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-sm text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <Leaf className="h-3.5 w-3.5" />
            {inUsePots.length} in use
          </Badge>
          {retiredPots.length > 0 && (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-sm">
              <ArchiveRestore className="h-3.5 w-3.5" />
              {retiredPots.length} retired
            </Badge>
          )}
        </div>
      )}

      {/* Available pots */}
      {availablePots.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <h2 className="font-medium">
              Available ({availablePots.length})
            </h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Ready to use for repotting
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availablePots.map((pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))}
          </div>
        </section>
      )}

      {/* In-use pots */}
      {inUsePots.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-blue-500" />
            <h2 className="font-medium">
              In Use ({inUsePots.length})
            </h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Currently assigned to plants
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inUsePots.map((pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))}
          </div>
        </section>
      )}

      {/* Retired pots */}
      {retiredPots.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-medium text-muted-foreground">
              Retired ({retiredPots.length})
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {retiredPots.map((pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasPots && (
        <EmptyState
          icon={Package}
          title="No pots yet"
          description="Add pots to your collection to track which plants are in which pots and make repotting easier."
        >
          <PotDialog />
        </EmptyState>
      )}
    </div>
  );
}

function PotCard({ pot }: { pot: PotWithUsage }) {
  return (
    <Card className={pot.is_retired ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {/* Photo or placeholder */}
          {pot.photo_url ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={pot.photo_url}
                alt={pot.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base truncate">{pot.name}</CardTitle>
              <PotActions pot={pot} />
            </div>
            {pot.material && (
              <CardDescription className="truncate">
                {pot.material}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Usage status */}
        {pot.in_use && pot.used_by_plant_name && (
          <Link 
            href={`/plants/${pot.used_by_plant_id}`}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <Leaf className="h-3.5 w-3.5" />
            <span>In use by {pot.used_by_plant_name}</span>
          </Link>
        )}
        
        {/* Attributes */}
        <div className="flex flex-wrap gap-2">
          {pot.size_inches && (
            <Badge variant="secondary" className="gap-1">
              <Ruler className="h-3 w-3" />
              {pot.size_inches}"
            </Badge>
          )}
          {pot.color && (
            <Badge variant="secondary" className="gap-1">
              <Palette className="h-3 w-3" />
              {pot.color}
            </Badge>
          )}
          <Badge variant={pot.has_drainage ? "secondary" : "outline"} className="gap-1">
            <Droplet className="h-3 w-3" />
            {pot.has_drainage ? "Drainage" : "No drainage"}
          </Badge>
          {pot.is_retired && (
            <Badge variant="outline">Retired</Badge>
          )}
        </div>
        
        {pot.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {pot.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
