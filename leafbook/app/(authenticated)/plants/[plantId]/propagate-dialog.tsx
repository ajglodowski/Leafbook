"use client";

import { Home, Sprout, TreePine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect,useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createPropagatedPlant } from "../actions";

interface PropagateDialogProps {
  parentPlantId: string;
  parentPlantName: string;
  parentPlantTypeId: string | null;
}

const lightOptions = [
  { value: "dark", label: "Dark" },
  { value: "low_indirect", label: "Low Indirect" },
  { value: "medium_indirect", label: "Medium Indirect" },
  { value: "bright_indirect", label: "Bright Indirect" },
  { value: "direct", label: "Direct" },
];

function getLightLabel(value: string): string {
  return lightOptions.find((opt) => opt.value === value)?.label || value;
}

export function PropagateDialog({
  parentPlantId,
  parentPlantName,
  parentPlantTypeId,
}: PropagateDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [plantLocation, setPlantLocation] = useState<"indoor" | "outdoor">("indoor");
  const [location, setLocation] = useState("");
  const [lightExposure, setLightExposure] = useState("");
  const [propagationDate, setPropagationDate] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(`${parentPlantName} Jr.`);
      setNickname("");
      setPlantLocation("indoor");
      setLocation("");
      setLightExposure("");
      setPropagationDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setError(null);
    }
  }, [isOpen, parentPlantName]);

  const canSubmit = name.trim();

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const formData = new FormData();
    formData.set("parentPlantId", parentPlantId);
    formData.set("name", name.trim());
    formData.set("plant_location", plantLocation);
    if (parentPlantTypeId) formData.set("plantTypeId", parentPlantTypeId);
    if (nickname.trim()) formData.set("nickname", nickname.trim());
    if (location.trim()) formData.set("location", location.trim());
    if (lightExposure) formData.set("light_exposure", lightExposure);
    if (propagationDate) formData.set("propagation_date", propagationDate);
    if (description.trim()) formData.set("description", description.trim());

    startTransition(async () => {
      const result = await createPropagatedPlant(formData);
      if (result.success && result.plantId) {
        setIsOpen(false);
        router.push(`/plants/${result.plantId}`);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5"
      >
        <Sprout className="h-4 w-4" />
        Propagate
      </Button>

      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl font-semibold flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            Create propagation
          </AlertDialogTitle>
          <AlertDialogDescription>
            Create a new plant from <span className="font-medium">{parentPlantName}</span>. The new
            plant will be linked as a child of this parent.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="prop-name">Name *</Label>
            <Input
              id="prop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Kitchen Pothos Cutting"
            />
          </div>

          {/* Nickname (optional) */}
          <div className="space-y-2">
            <Label htmlFor="prop-nickname">Nickname (optional)</Label>
            <Input
              id="prop-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Mini Me"
            />
          </div>

          {/* Propagation date */}
          <div className="space-y-2">
            <Label htmlFor="prop-date">Propagation date</Label>
            <Input
              id="prop-date"
              type="date"
              value={propagationDate}
              onChange={(e) => setPropagationDate(e.target.value)}
            />
          </div>

          {/* Indoor/Outdoor toggle */}
          <div className="space-y-2">
            <Label>Environment</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={plantLocation === "indoor" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPlantLocation("indoor")}
                className="flex-1 gap-2"
              >
                <Home className="h-4 w-4" />
                Indoor
              </Button>
              <Button
                type="button"
                variant={plantLocation === "outdoor" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPlantLocation("outdoor")}
                className="flex-1 gap-2"
              >
                <TreePine className="h-4 w-4" />
                Outdoor
              </Button>
            </div>
          </div>

          {/* Location (optional) */}
          <div className="space-y-2">
            <Label htmlFor="prop-location">Location (optional)</Label>
            <Input
              id="prop-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Propagation station, Water glass"
            />
          </div>

          {/* Light exposure (optional) */}
          <div className="space-y-2">
            <Label>Light exposure (optional)</Label>
            <Select
              value={lightExposure}
              onValueChange={(value) => setLightExposure(value || "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select light level">
                  {lightExposure ? getLightLabel(lightExposure) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {lightOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="prop-description">Notes (optional)</Label>
            <Textarea
              id="prop-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any notes about this propagation..."
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {isPending ? "Creating..." : "Create propagation"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
