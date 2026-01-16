import Image from "next/image";
import { Package, Droplet, Ruler, Palette, ArchiveRestore } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PotDialog } from "./pot-dialog";
import { PotActions } from "./pot-actions";

export const metadata = {
  title: "Pots | Leafbook",
  description: "Manage your pot inventory",
};

interface Pot {
  id: string;
  name: string;
  size_inches: number | null;
  material: string | null;
  has_drainage: boolean;
  color: string | null;
  notes: string | null;
  photo_url: string | null;
  is_retired: boolean;
  created_at: string;
}

export default async function PotsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all pots (including retired)
  const { data: pots, error } = await supabase
    .from("user_pots")
    .select("*")
    .eq("user_id", user!.id)
    .order("is_retired", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pots:", error);
  }

  const activePots = pots?.filter((p) => !p.is_retired) || [];
  const retiredPots = pots?.filter((p) => p.is_retired) || [];
  const hasPots = pots && pots.length > 0;

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

      {/* Active pots */}
      {activePots.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-medium text-muted-foreground">
            Active ({activePots.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePots.map((pot: Pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))}
          </div>
        </section>
      )}

      {/* Retired pots */}
      {retiredPots.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-medium text-muted-foreground">
            <ArchiveRestore className="h-4 w-4" />
            Retired ({retiredPots.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {retiredPots.map((pot: Pot) => (
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

function PotCard({ pot }: { pot: Pot }) {
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
      <CardContent>
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
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {pot.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
