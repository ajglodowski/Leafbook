"use client";

import { ChevronDown, Combine, GitBranch, Globe, Home, Search, TreePine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCountriesGroupedByRegion, getCountryName, getRegionForCountry } from "@/lib/origin-mapping";
import type { Tables } from "@/lib/supabase/database.types";

import { createPlantType, updatePlantType } from "./actions";
import { type TaxonomyNodeMatch,TaxonomyNodeMatcher } from "./taxonomy-node-matcher";

type PlantType = Tables<"plant_types">;
type LocationPreference = "indoor" | "outdoor" | "both";

// Light options with numeric values for ordering
const lightOptions = [
  { value: "dark", label: "Dark", numeric: 1 },
  { value: "low_indirect", label: "Low Indirect", numeric: 2 },
  { value: "medium_indirect", label: "Medium Indirect", numeric: 3 },
  { value: "bright_indirect", label: "Bright Indirect", numeric: 4 },
  { value: "direct", label: "Direct", numeric: 5 },
];

// Size options with numeric values for ordering
const sizeOptions = [
  { value: "small", label: "Small", numeric: 1 },
  { value: "medium", label: "Medium", numeric: 2 },
  { value: "large", label: "Large", numeric: 3 },
  { value: "extra_large", label: "Extra Large", numeric: 4 },
];

const locationOptions: Array<{ value: LocationPreference; label: string; icon: typeof Home }> = [
  { value: "indoor", label: "Indoor", icon: Home },
  { value: "outdoor", label: "Outdoor", icon: TreePine },
  { value: "both", label: "Both", icon: Combine },
];

// Helper functions to get labels from values
function getLightLabel(value: string): string {
  return lightOptions.find((opt) => opt.value === value)?.label || value;
}

function getSizeLabel(value: string): string {
  return sizeOptions.find((opt) => opt.value === value)?.label || value;
}

function getLightNumeric(value: string): number {
  return lightOptions.find((opt) => opt.value === value)?.numeric || 0;
}

function getSizeNumeric(value: string): number {
  return sizeOptions.find((opt) => opt.value === value)?.numeric || 0;
}

export type OriginData = {
  country_code: string;
  region: string | null;
};

interface PlantTypeFormProps {
  plantType?: Partial<PlantType>;
  mode: "create" | "edit";
  wikidataQid?: string | null;
  wikipediaTitle?: string | null;
  initialOrigins?: OriginData[];
}

export function PlantTypeForm({ plantType, mode, wikidataQid, wikipediaTitle, initialOrigins }: PlantTypeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(plantType?.name || "");
  const [scientificName, setScientificName] = useState(plantType?.scientific_name || "");
  const [description, setDescription] = useState(plantType?.description || "");
  
  // Light range (min/max)
  const [lightMin, setLightMin] = useState(plantType?.light_min || "");
  const [lightMax, setLightMax] = useState(plantType?.light_max || "");
  
  // Size range (min/max)
  const [sizeMin, setSizeMin] = useState(plantType?.size_min || "");
  const [sizeMax, setSizeMax] = useState(plantType?.size_max || "");
  
  // Location preference
  const [locationPreference, setLocationPreference] = useState<LocationPreference>(
    plantType?.location_preference ?? "indoor"
  );
  
  // Origins (multiple countries with auto-derived regions)
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>(
    initialOrigins?.map(o => o.country_code) || []
  );
  const [originSelectorOpen, setOriginSelectorOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  
  // Derive unique regions from selected countries
  const selectedRegions = useMemo(() => {
    const regions = new Set<string>();
    selectedCountryCodes.forEach(code => {
      const region = getRegionForCountry(code);
      if (region) regions.add(region);
    });
    return Array.from(regions).sort();
  }, [selectedCountryCodes]);
  
  const [wateringDays, setWateringDays] = useState(plantType?.watering_frequency_days?.toString() || "");
  const [fertilizingDays, setFertilizingDays] = useState(plantType?.fertilizing_frequency_days?.toString() || "");
  
  // Country selection helpers
  const countriesGrouped = useMemo(() => getCountriesGroupedByRegion(), []);
  
  // Filter countries by search term
  const filteredCountriesGrouped = useMemo(() => {
    if (!countrySearch.trim()) return countriesGrouped;
    
    const searchLower = countrySearch.toLowerCase();
    return countriesGrouped
      .map(group => ({
        ...group,
        countries: group.countries.filter(country => 
          country.name.toLowerCase().includes(searchLower) ||
          country.code.toLowerCase().includes(searchLower)
        )
      }))
      .filter(group => group.countries.length > 0);
  }, [countriesGrouped, countrySearch]);
  
  function toggleCountry(code: string) {
    setSelectedCountryCodes(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  }
  
  function removeCountry(code: string) {
    setSelectedCountryCodes(prev => prev.filter(c => c !== code));
  }
  const [careNotes, setCareNotes] = useState(plantType?.care_notes || "");
  
  // Manual taxonomy path (comma-separated, root→leaf)
  const [taxonomyPath, setTaxonomyPath] = useState("");
  
  // Taxonomy Wikidata match (anchor node)
  const [taxonomyMatch, setTaxonomyMatch] = useState<TaxonomyNodeMatch | null>(null);
  
  // Validate that max >= min for light
  const isLightRangeValid = !lightMin || !lightMax || getLightNumeric(lightMax) >= getLightNumeric(lightMin);
  // Validate that max >= min for size
  const isSizeRangeValid = !sizeMin || !sizeMax || getSizeNumeric(sizeMax) >= getSizeNumeric(sizeMin);
  
  // Parse and validate taxonomy path
  const taxonomyNodes = useMemo(() => {
    if (!taxonomyPath.trim()) return [];
    return taxonomyPath.split(",").map(s => s.trim()).filter(s => s.length > 0);
  }, [taxonomyPath]);
  
  // Taxonomy path is valid if empty or has at least 2 nodes
  const isTaxonomyPathValid = taxonomyNodes.length === 0 || taxonomyNodes.length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Validate ranges
    if (!isLightRangeValid) {
      setError("Light max must be greater than or equal to light min");
      return;
    }
    if (!isSizeRangeValid) {
      setError("Size max must be greater than or equal to size min");
      return;
    }
    if (!isTaxonomyPathValid) {
      setError("Taxonomy path must have at least 2 nodes (e.g., Biota, Plantae)");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("scientific_name", scientificName);
    formData.set("description", description);
    formData.set("light_min", lightMin);
    formData.set("light_max", lightMax);
    formData.set("size_min", sizeMin);
    formData.set("size_max", sizeMax);
    formData.set("location_preference", locationPreference);
    formData.set("watering_frequency_days", wateringDays);
    formData.set("fertilizing_frequency_days", fertilizingDays);
    formData.set("care_notes", careNotes);
    
    // Origins as JSON array with country codes and derived regions
    const origins = selectedCountryCodes.map(code => ({
      country_code: code,
      region: getRegionForCountry(code) || null,
    }));
    formData.set("origins", JSON.stringify(origins));
    
    // Manual taxonomy path (if provided)
    if (taxonomyPath.trim()) {
      formData.set("taxonomy_path", taxonomyPath.trim());
      
      // Include Wikidata match for hybrid taxonomy (if selected)
      if (taxonomyMatch) {
        formData.set("taxonomy_wikidata_match", JSON.stringify(taxonomyMatch));
      }
    }
    
    // Include Wikidata fields if provided (for create from Wikidata flow)
    if (wikidataQid) {
      formData.set("wikidata_qid", wikidataQid);
    }
    if (wikipediaTitle) {
      formData.set("wikipedia_title", wikipediaTitle);
    }

    const plantTypeId = plantType?.id;
    if (mode === "edit" && !plantTypeId) {
      setError("Missing plant type ID for edit");
      return;
    }

    startTransition(async () => {
      let result;
      if (mode === "create") {
        result = await createPlantType(formData);
      } else {
        result = await updatePlantType(plantTypeId!, formData);
      }

      if (result.success) {
        router.push("/admin/plant-types");
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
          <CardDescription>The plant's common and scientific names</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Common Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monstera"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scientific_name">Scientific Name</Label>
              <Input
                id="scientific_name"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="e.g., Monstera deliciosa"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this plant..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location</CardTitle>
          <CardDescription>Where this plant type can thrive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Environment</Label>
            <div className="flex gap-2">
              {locationOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={locationPreference === option.value ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setLocationPreference(option.value)}
                    className="flex-1 gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Native Origin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Native Origins
          </CardTitle>
          <CardDescription>Where this plant type originates from in the wild (select multiple countries)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected countries display */}
          {selectedCountryCodes.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Countries ({selectedCountryCodes.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCountryCodes.map(code => (
                  <Badge key={code} variant="secondary" className="gap-1 pr-1">
                    {getCountryName(code)}
                    <button
                      type="button"
                      onClick={() => removeCountry(code)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Derived regions display */}
          {selectedRegions.length > 0 && (
            <div className="space-y-2">
              <Label>Regions</Label>
              <div className="flex flex-wrap gap-2">
                {selectedRegions.map(region => (
                  <Badge key={region} variant="outline">
                    {region}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically determined from selected countries
              </p>
            </div>
          )}

          {/* Country selector */}
          <Collapsible open={originSelectorOpen} onOpenChange={setOriginSelectorOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                {selectedCountryCodes.length === 0 ? "Select countries" : "Add more countries"}
                <ChevronDown className={`h-4 w-4 transition-transform ${originSelectorOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-md border">
                {/* Search bar */}
                <div className="sticky top-0 bg-background p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                
                {/* Country list */}
                <div className="max-h-56 overflow-y-auto p-2 space-y-4">
                  {filteredCountriesGrouped.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No countries found matching "{countrySearch}"
                    </p>
                  ) : (
                    filteredCountriesGrouped.map(group => (
                      <div key={group.region} className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{group.region}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {group.countries.map(country => (
                            <label 
                              key={country.code} 
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1"
                            >
                              <Checkbox
                                checked={selectedCountryCodes.includes(country.code)}
                                onCheckedChange={() => toggleCountry(country.code)}
                              />
                              {country.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Care requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Care Requirements</CardTitle>
          <CardDescription>Recommended care settings for this plant type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Light Range */}
          <div className="space-y-2">
            <Label>Light Requirement Range</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select the minimum and maximum light levels this plant can tolerate
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="light-min" className="text-xs text-muted-foreground">Min</Label>
                <Select value={lightMin} onValueChange={(value) => setLightMin(value || "")}>
                  <SelectTrigger id="light-min" className="w-full">
                    <SelectValue placeholder="Select min light">
                      {lightMin ? getLightLabel(lightMin) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {lightOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="light-max" className="text-xs text-muted-foreground">Max</Label>
                <Select value={lightMax} onValueChange={(value) => setLightMax(value || "")}>
                  <SelectTrigger id="light-max" className={`w-full ${!isLightRangeValid ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select max light">
                      {lightMax ? getLightLabel(lightMax) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {lightOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!isLightRangeValid && (
              <p className="text-xs text-destructive">Max must be greater than or equal to min</p>
            )}
          </div>

          {/* Size Range */}
          <div className="space-y-2">
            <Label>Size Range</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select the minimum and maximum mature size for this plant type
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="size-min" className="text-xs text-muted-foreground">Min</Label>
                <Select value={sizeMin} onValueChange={(value) => setSizeMin(value || "")}>
                  <SelectTrigger id="size-min" className="w-full">
                    <SelectValue placeholder="Select min size">
                      {sizeMin ? getSizeLabel(sizeMin) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {sizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="size-max" className="text-xs text-muted-foreground">Max</Label>
                <Select value={sizeMax} onValueChange={(value) => setSizeMax(value || "")}>
                  <SelectTrigger id="size-max" className={`w-full ${!isSizeRangeValid ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select max size">
                      {sizeMax ? getSizeLabel(sizeMax) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {sizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!isSizeRangeValid && (
              <p className="text-xs text-destructive">Max must be greater than or equal to min</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="watering">Watering Frequency (days)</Label>
              <Input
                id="watering"
                type="number"
                min="1"
                max="365"
                value={wateringDays}
                onChange={(e) => setWateringDays(e.target.value)}
                placeholder="e.g., 7"
              />
              <p className="text-xs text-muted-foreground">Days between watering</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fertilizing">Fertilizing Frequency (days)</Label>
              <Input
                id="fertilizing"
                type="number"
                min="1"
                max="365"
                value={fertilizingDays}
                onChange={(e) => setFertilizingDays(e.target.value)}
                placeholder="e.g., 30"
              />
              <p className="text-xs text-muted-foreground">Days between fertilizing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Care Tips</CardTitle>
          <CardDescription>Additional care advice for plant owners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="care_notes">Care Notes</Label>
            <Textarea
              id="care_notes"
              value={careNotes}
              onChange={(e) => setCareNotes(e.target.value)}
              placeholder="Tips and advice for caring for this plant..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Taxonomy Path */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5" />
            Manual Taxonomy Path
          </CardTitle>
          <CardDescription>
            For plants without full Wikidata coverage, paste the taxonomy hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxonomy_path">Taxonomy Path (comma-separated)</Label>
            <Textarea
              id="taxonomy_path"
              value={taxonomyPath}
              onChange={(e) => {
                setTaxonomyPath(e.target.value);
                // Clear match when path changes
                setTaxonomyMatch(null);
              }}
              placeholder="Biota, Plantae, Tracheophyta, Angiosperms, Monocots, Asparagales, Asparagaceae, Agavoideae, Agave"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Enter the full taxonomy path from root to leaf, separated by commas. Example: Biota, Plantae, ..., Genus, Species.
              The system will try to find the deepest Wikidata match and only create manual entries below it.
            </p>
            {!isTaxonomyPathValid && (
              <p className="text-xs text-destructive">
                Taxonomy path must have at least 2 nodes (e.g., Biota, Plantae)
              </p>
            )}
            {taxonomyNodes.length > 0 && isTaxonomyPathValid && (
              <p className="text-xs text-muted-foreground">
                {taxonomyNodes.length} nodes detected: {taxonomyNodes[0]} → ... → {taxonomyNodes[taxonomyNodes.length - 1]}
              </p>
            )}
          </div>
          
          {/* Wikidata matching for taxonomy nodes */}
          {taxonomyNodes.length >= 2 && isTaxonomyPathValid && (
            <TaxonomyNodeMatcher
              nodes={taxonomyNodes}
              selectedMatch={taxonomyMatch}
              onMatchChange={setTaxonomyMatch}
            />
          )}
        </CardContent>
      </Card>

      {/* Error and actions */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/plant-types")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name.trim() || !isLightRangeValid || !isSizeRangeValid || !isTaxonomyPathValid}>
          {isPending 
            ? (mode === "create" ? "Creating..." : "Saving...") 
            : (mode === "create" ? "Create plant type" : "Save changes")}
        </Button>
      </div>
    </form>
  );
}
