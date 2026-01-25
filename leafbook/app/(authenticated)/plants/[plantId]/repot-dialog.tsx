"use client";

import { Calendar, Check, Droplet, List, Package, Palette,Plus, Ruler, Search, Sparkles, Sprout } from "lucide-react";
import Image from "next/image";
import { type ReactNode,useEffect, useMemo, useState, useTransition } from "react";

import { createPot } from "@/app/(authenticated)/pots/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { logRepotEvent, updateRepotEvent } from "./actions";

interface Pot {
  id: string;
  name: string;
  size_inches: number | null;
  material: string | null;
  photo_url: string | null;
  is_retired: boolean;
  has_drainage?: boolean;
  color?: string | null;
}

interface PotWithUsage extends Pot {
  in_use: boolean;
  used_by_plant_id: string | null;
  used_by_plant_name: string | null;
}

type TabId = "recommended" | "browse" | "new";

interface RepotEditEvent {
  id: string;
  eventDate: string;
  fromPotId?: string | null;
  toPotId?: string | null;
}

interface RepotDialogProps {
  plantId: string;
  plantName: string;
  currentPotId: string | null;
  currentPotSize: number | null;
  pots: Pot[];
  unusedPots: PotWithUsage[];
  initialEvent?: RepotEditEvent | null;
  trigger?: ReactNode;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function RepotDialog({ 
  plantId, 
  plantName, 
  currentPotId, 
  currentPotSize,
  pots,
  unusedPots,
  initialEvent = null,
  trigger,
}: RepotDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialEvent;
  
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("recommended");
  
  // Search/filter state for browse tab
  const [searchQuery, setSearchQuery] = useState("");
  
  // New pot form state
  const [newPotData, setNewPotData] = useState({
    name: "",
    size_inches: null as number | null,
    material: "",
    has_drainage: true,
    color: "",
    notes: "",
  });
  const [isCreatingPot, setIsCreatingPot] = useState(false);

  const currentPot = currentPotId ? pots.find(p => p.id === currentPotId) : null;

  const selectablePots = useMemo(() => {
    const list: Pot[] = [...unusedPots];
    if (currentPot && !list.some((pot) => pot.id === currentPot.id)) {
      list.unshift(currentPot);
    }
    return list;
  }, [unusedPots, currentPot]);

  // Calculate recommended pots (unused, within [current size, current size + 2])
  const recommendedPots = useMemo(() => {
    const available = selectablePots;
    if (currentPotSize !== null) {
      const minSize = currentPotSize;
      const maxSize = currentPotSize + 2;
      
      const filtered = available.filter(
        p => p.size_inches !== null && p.size_inches >= minSize && p.size_inches <= maxSize
      );
      
      // Sort by size ascending
      return filtered.sort((a, b) => {
        if (a.size_inches === null) return 1;
        if (b.size_inches === null) return -1;
        return a.size_inches - b.size_inches;
      });
    }
    
    // No current pot size: return all selectable pots sorted by size
    return available.sort((a, b) => {
      if (a.size_inches !== null && b.size_inches !== null) {
        return a.size_inches - b.size_inches;
      }
      if (a.size_inches !== null) return -1;
      if (b.size_inches !== null) return 1;
      return 0;
    });
  }, [selectablePots, currentPotSize]);

  // Filter browse list by search
  const filteredBrowsePots = useMemo(() => {
    const available = selectablePots;
    if (!searchQuery.trim()) return available;
    
    const query = searchQuery.toLowerCase();
    return available.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.material?.toLowerCase().includes(query) ||
      p.color?.toLowerCase().includes(query) ||
      (p.size_inches && `${p.size_inches}`.includes(query))
    );
  }, [selectablePots, searchQuery]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDate(initialEvent?.eventDate ? formatDateForInput(new Date(initialEvent.eventDate)) : formatDateForInput(new Date()));
      setSelectedPotId(initialEvent?.toPotId ?? null);
      setError(null);
      setIsDone(false);
      setActiveTab(recommendedPots.length > 0 ? "recommended" : "browse");
      setSearchQuery("");
      setNewPotData({
        name: "",
        size_inches: null,
        material: "",
        has_drainage: true,
        color: "",
        notes: "",
      });
      setIsCreatingPot(false);
    }
  }, [open, recommendedPots.length, initialEvent]);

  async function handleCreatePot() {
    if (!newPotData.name.trim()) {
      setError("Pot name is required");
      return;
    }
    
    setIsCreatingPot(true);
    setError(null);
    
    const result = await createPot(newPotData);
    
    if (result.success && result.potId) {
      // Select the newly created pot
      setSelectedPotId(result.potId);
      // Switch to browse tab to show selection
      setActiveTab("browse");
      setNewPotData({
        name: "",
        size_inches: null,
        material: "",
        has_drainage: true,
        color: "",
        notes: "",
      });
    } else {
      setError(result.error || "Failed to create pot");
    }
    
    setIsCreatingPot(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = isEditing && initialEvent
        ? await updateRepotEvent(initialEvent.id, {
            eventDate: selectedDate,
            fromPotId: initialEvent.fromPotId ?? currentPotId,
            toPotId: selectedPotId,
          })
        : await logRepotEvent(plantId, {
            eventDate: selectedDate,
            fromPotId: currentPotId,
            toPotId: selectedPotId,
          });

      if (result.success) {
        setIsDone(true);
        setTimeout(() => {
          setOpen(false);
          setIsDone(false);
        }, 1500);
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "recommended", label: "Recommended", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "browse", label: "Inventory", icon: <List className="h-3.5 w-3.5" /> },
    { id: "new", label: "Add New", icon: <Plus className="h-3.5 w-3.5" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1">
            <Sprout className="h-4 w-4" />
            Repot
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Sprout className="h-5 w-5 text-orange-500" />
            {isEditing ? `Edit repot for ${plantName}` : `Repot ${plantName}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the date or pot for this repot event."
              : "Choose a new pot from your inventory or add a new one."}
          </DialogDescription>
        </DialogHeader>

        {isDone ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium text-green-600">Repotted!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="repot-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                When did you repot?
              </Label>
              <Input
                id="repot-date"
                type="date"
                value={selectedDate}
                max={formatDateForInput(new Date())}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Current pot display */}
            {currentPot && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Current pot</p>
                <div className="flex items-center gap-3">
                  {currentPot.photo_url ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={currentPot.photo_url}
                        alt={currentPot.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{currentPot.name}</p>
                    {currentPot.size_inches && (
                      <p className="text-xs text-muted-foreground">{currentPot.size_inches}" {currentPot.material || ""}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    activeTab === tab.id
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === "recommended" && recommendedPots.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {recommendedPots.length}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* Recommended tab */}
              {activeTab === "recommended" && (
                <div className="h-full flex flex-col">
                  {recommendedPots.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {currentPotSize && (
                          <span>Showing pots {currentPotSize}" to {currentPotSize + 2}"</span>
                        )}
                        {currentPot && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                            Same pot ok
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto rounded-lg border">
                        <PotList 
                          pots={recommendedPots} 
                          selectedPotId={selectedPotId} 
                          onSelect={setSelectedPotId}
                          showNoPotOption
                          currentPotId={currentPotId}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border rounded-lg border-dashed">
                      <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-3" />
                      <p className="font-medium text-muted-foreground">No recommended pots</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentPotSize 
                          ? `No available pots between ${currentPotSize}" and ${currentPotSize + 2}"`
                          : "Add pots with sizes to get recommendations"}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("browse")}
                        >
                          <List className="h-3.5 w-3.5 mr-1.5" />
                          Browse all
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("new")}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add new
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Browse tab */}
              {activeTab === "browse" && (
                <div className="h-full flex flex-col gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pots..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {filteredBrowsePots.length > 0 ? (
                    <div className="flex-1 overflow-y-auto rounded-lg border min-h-0">
                      <PotList 
                        pots={filteredBrowsePots} 
                        selectedPotId={selectedPotId} 
                        onSelect={setSelectedPotId}
                        showNoPotOption
                        currentPotId={currentPotId}
                      />
                    </div>
                  ) : selectablePots.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border rounded-lg border-dashed">
                      <Package className="h-8 w-8 text-muted-foreground/50 mb-3" />
                      <p className="font-medium text-muted-foreground">No available pots</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        All your pots are in use or retired
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setActiveTab("new")}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add new pot
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border rounded-lg border-dashed">
                      <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
                      <p className="font-medium text-muted-foreground">No matches found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try a different search term
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* New pot tab */}
              {activeTab === "new" && (
                <div className="h-full overflow-y-auto space-y-4 pr-1">
                  <div className="space-y-2">
                    <Label htmlFor="new-pot-name">Name *</Label>
                    <Input
                      id="new-pot-name"
                      value={newPotData.name}
                      onChange={(e) => setNewPotData({ ...newPotData, name: e.target.value })}
                      placeholder="e.g., Terracotta 6-inch"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-pot-size" className="flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" />
                        Size (inches)
                      </Label>
                      <Input
                        id="new-pot-size"
                        type="number"
                        step="0.5"
                        min="0"
                        value={newPotData.size_inches ?? ""}
                        onChange={(e) =>
                          setNewPotData({
                            ...newPotData,
                            size_inches: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder="6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pot-material">Material</Label>
                      <Input
                        id="new-pot-material"
                        value={newPotData.material}
                        onChange={(e) => setNewPotData({ ...newPotData, material: e.target.value })}
                        placeholder="Terracotta"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-pot-color" className="flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5" />
                      Color
                    </Label>
                    <Input
                      id="new-pot-color"
                      value={newPotData.color}
                      onChange={(e) => setNewPotData({ ...newPotData, color: e.target.value })}
                      placeholder="Red-brown"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="new-pot-drainage"
                      checked={newPotData.has_drainage}
                      onCheckedChange={(checked) =>
                        setNewPotData({ ...newPotData, has_drainage: checked === true })
                      }
                    />
                    <Label htmlFor="new-pot-drainage" className="font-normal cursor-pointer flex items-center gap-1.5">
                      <Droplet className="h-3.5 w-3.5" />
                      Has drainage hole
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-pot-notes">Notes</Label>
                    <Textarea
                      id="new-pot-notes"
                      value={newPotData.notes}
                      onChange={(e) => setNewPotData({ ...newPotData, notes: e.target.value })}
                      placeholder="Any additional details..."
                      rows={2}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={handleCreatePot}
                    disabled={isCreatingPot || !newPotData.name.trim()}
                  >
                    {isCreatingPot ? "Creating..." : "Create pot and select"}
                  </Button>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-1 bg-orange-500 hover:bg-orange-600">
                {isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Sprout className="h-4 w-4" />
                    {isEditing ? "Save changes" : "Log repot"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Pot list component
function PotList({ 
  pots, 
  selectedPotId, 
  onSelect,
  showNoPotOption = false,
  currentPotId,
}: { 
  pots: Pot[]; 
  selectedPotId: string | null; 
  onSelect: (id: string | null) => void;
  showNoPotOption?: boolean;
  currentPotId?: string | null;
}) {
  return (
    <>
      {showNoPotOption && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 border-b",
            selectedPotId === null && "bg-primary/5 border-primary/20"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-muted-foreground">No pot selected</p>
            <p className="text-xs text-muted-foreground">Just log the repot event</p>
          </div>
          {selectedPotId === null && (
            <Check className="h-4 w-4 text-primary shrink-0" />
          )}
        </button>
      )}
      
      {pots.map((pot, index) => (
        <button
          key={pot.id}
          type="button"
          onClick={() => onSelect(pot.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50",
            index < pots.length - 1 && "border-b",
            selectedPotId === pot.id && "bg-primary/5"
          )}
        >
          {pot.photo_url ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                src={pot.photo_url}
                alt={pot.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{pot.name}</p>
            {(pot.size_inches || pot.material) && (
              <p className="text-xs text-muted-foreground truncate">
                {[
                  pot.size_inches ? `${pot.size_inches}"` : null,
                  pot.material,
                ].filter(Boolean).join(" · ")}
              </p>
            )}
            {currentPotId === pot.id && (
              <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5">
                Current pot
              </p>
            )}
          </div>
          {selectedPotId === pot.id && (
            <Check className="h-4 w-4 text-primary shrink-0" />
          )}
        </button>
      ))}
    </>
  );
}
