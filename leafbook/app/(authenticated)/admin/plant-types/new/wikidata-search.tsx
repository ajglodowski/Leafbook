"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface WikidataSearchResult {
  qid: string;
  label: string;
  description: string | null;
  scientificName: string | null;
  wikipediaTitle: string | null;
  rank: string | null;
}

interface WikidataSearchProps {
  onSelect: (data: {
    name: string;
    scientificName: string | null;
    description: string | null;
    qid: string;
    wikipediaTitle: string | null;
  }) => void;
}

export function WikidataSearch({ onSelect }: WikidataSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WikidataSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<WikidataSearchResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedResult(null);

    try {
      const response = await fetch(
        `/api/admin/wikidata/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setSearchResults(data.results || []);
      if (data.results?.length === 0) {
        setSearchError("No plant taxa found matching your search");
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectResult(result: WikidataSearchResult) {
    setSelectedResult(result);
    
    // Fetch Wikipedia description if available
    if (result.wikipediaTitle) {
      fetchWikipediaDescription(result);
    } else {
      // Use Wikidata description
      onSelect({
        name: result.label,
        scientificName: result.scientificName,
        description: result.description,
        qid: result.qid,
        wikipediaTitle: result.wikipediaTitle,
      });
    }
  }

  async function fetchWikipediaDescription(result: WikidataSearchResult) {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.wikipediaTitle!.replace(/ /g, "_"))}`
      );
      
      if (response.ok) {
        const data = await response.json();
        onSelect({
          name: result.label,
          scientificName: result.scientificName,
          description: data.extract || result.description,
          qid: result.qid,
          wikipediaTitle: result.wikipediaTitle,
        });
      } else {
        onSelect({
          name: result.label,
          scientificName: result.scientificName,
          description: result.description,
          qid: result.qid,
          wikipediaTitle: result.wikipediaTitle,
        });
      }
    } catch {
      onSelect({
        name: result.label,
        scientificName: result.scientificName,
        description: result.description,
        qid: result.qid,
        wikipediaTitle: result.wikipediaTitle,
      });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Create from Wikidata
            </CardTitle>
            <CardDescription>
              Search Wikidata to pre-fill plant information
            </CardDescription>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wikidata-search-new">Search Wikidata</Label>
            <div className="flex gap-2">
              <Input
                id="wikidata-search-new"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by common or scientific name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="gap-1"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>
          </div>

          {searchError && (
            <p className="text-sm text-destructive">{searchError}</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Select a result to pre-fill the form</Label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
                {searchResults.map((result) => (
                  <button
                    key={result.qid}
                    onClick={() => handleSelectResult(result)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedResult?.qid === result.qid
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{result.label}</p>
                        {result.scientificName && (
                          <p className="text-sm italic text-muted-foreground">
                            {result.scientificName}
                          </p>
                        )}
                        {result.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {result.description}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground">
                            {result.qid}
                          </span>
                          {result.rank && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize">
                              {result.rank}
                            </span>
                          )}
                          {result.wikipediaTitle && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Has Wikipedia article
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedResult?.qid === result.qid && (
                        <Check className="h-5 w-5 shrink-0 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedResult && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Form fields pre-filled from {selectedResult.label}. You can edit them below before saving.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
