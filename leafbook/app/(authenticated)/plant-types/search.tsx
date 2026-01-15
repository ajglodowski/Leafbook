"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Sun, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransition, useState, useEffect, useCallback } from "react";

const lightOptions = [
  { value: "dark", label: "Dark" },
  { value: "low_indirect", label: "Low Indirect" },
  { value: "medium_indirect", label: "Medium Indirect" },
  { value: "bright_indirect", label: "Bright Indirect" },
  { value: "direct", label: "Direct" },
];

const sizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "extra_large", label: "Extra Large" },
];

// Helper functions to get labels from values
function getLightLabel(value: string): string {
  return lightOptions.find((opt) => opt.value === value)?.label || "All light levels";
}

function getSizeLabel(value: string): string {
  return sizeOptions.find((opt) => opt.value === value)?.label || "All sizes";
}

export function PlantTypesSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");
  const lightValue = searchParams.get("light") || "";
  const sizeValue = searchParams.get("size") || "";

  const updateUrl = useCallback((params: { q?: string; light?: string; size?: string }) => {
    const newParams = new URLSearchParams();
    if (params.q) newParams.set("q", params.q);
    if (params.light) newParams.set("light", params.light);
    if (params.size) newParams.set("size", params.size);
    
    startTransition(() => {
      router.push(`/plant-types?${newParams.toString()}`);
    });
  }, [router]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateUrl({ q: searchValue, light: lightValue, size: sizeValue });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchValue, lightValue, sizeValue, updateUrl]);

  function handleLightChange(value: string | null) {
    const newLight = value === "all" || !value ? "" : value;
    updateUrl({ q: searchValue, light: newLight, size: sizeValue });
  }

  function handleSizeChange(value: string | null) {
    const newSize = value === "all" || !value ? "" : value;
    updateUrl({ q: searchValue, light: lightValue, size: newSize });
  }

  function clearFilters() {
    setSearchValue("");
    startTransition(() => {
      router.push("/plant-types");
    });
  }

  const hasFilters = searchValue || lightValue || sizeValue;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search plants..."
          className="pl-9"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {/* Light filter */}
      <Select value={lightValue || "all"} onValueChange={handleLightChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Light requirement">
            {getLightLabel(lightValue)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All light levels</SelectItem>
          {lightOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Size filter */}
      <Select value={sizeValue || "all"} onValueChange={handleSizeChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Size">
            {getSizeLabel(sizeValue)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sizes</SelectItem>
          {sizeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}

      {/* Loading indicator */}
      {isPending && (
        <span className="text-sm text-muted-foreground animate-pulse">Searching...</span>
      )}
    </div>
  );
}
