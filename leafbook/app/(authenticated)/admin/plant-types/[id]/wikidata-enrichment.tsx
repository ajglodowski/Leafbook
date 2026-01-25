"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WikidataSearchResult {
  qid: string;
  label: string;
  description: string | null;
  scientificName: string | null;
  wikipediaTitle: string | null;
  rank: string | null;
}

interface PlantType {
  id: string;
  name: string;
  scientific_name: string | null;
  description: string | null;
  wikidata_qid: string | null;
  wikipedia_title: string | null;
  wikipedia_lang: string | null;
  enriched_at: string | null;
}

interface WikidataEnrichmentProps {
  plantType: PlantType;
}

export function WikidataEnrichment({ plantType }: WikidataEnrichmentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    plantType.scientific_name || plantType.name
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WikidataSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Linking state
  const [selectedResult, setSelectedResult] = useState<WikidataSearchResult | null>(
    null
  );
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Import options
  const [importScientificName, setImportScientificName] = useState(true);
  const [importDescription, setImportDescription] = useState(true);
  const [overwriteMode, setOverwriteMode] = useState(false);

  // UI state
  const [isExpanded, setIsExpanded] = useState(true);

  const isLinked = !!plantType.wikidata_qid;

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

  async function handleLink() {
    if (!selectedResult) return;

    setIsLinking(true);
    setLinkError(null);
    setLinkSuccess(false);

    try {
      const response = await fetch("/api/admin/wikidata/link-and-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantTypeId: plantType.id,
          qid: selectedResult.qid,
          mode: overwriteMode ? "overwrite_selected" : "fill_empty",
          fields: {
            scientificName: importScientificName,
            description: importDescription,
            origin: true, // Always try to import origin data
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Link failed");
      }

      setLinkSuccess(true);
      setSelectedResult(null);
      setSearchResults([]);

      // Refresh the page to show updated data
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Link failed");
    } finally {
      setIsLinking(false);
    }
  }

  async function handleRefresh() {
    if (!plantType.wikidata_qid) return;

    setIsLinking(true);
    setLinkError(null);

    try {
      const response = await fetch("/api/admin/wikidata/link-and-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantTypeId: plantType.id,
          qid: plantType.wikidata_qid,
          mode: overwriteMode ? "overwrite_selected" : "fill_empty",
          fields: {
            scientificName: importScientificName,
            description: importDescription,
            origin: true, // Always try to import origin data
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Refresh failed");
      }

      setLinkSuccess(true);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setIsLinking(false);
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
              <LinkIcon className="h-5 w-5" />
              Wikidata / Wikipedia
              {isLinked && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="h-3 w-3" />
                  Linked
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {isLinked
                ? `Linked to ${plantType.wikidata_qid}`
                : "Import data and images from Wikipedia"}
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
          {/* Linked status */}
          {isLinked && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Wikidata: {plantType.wikidata_qid}
                  </p>
                  {plantType.wikipedia_title && (
                    <a
                      href={`https://${plantType.wikipedia_lang || "en"}.wikipedia.org/wiki/${encodeURIComponent(plantType.wikipedia_title.replace(/ /g, "_"))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Wikipedia: {plantType.wikipedia_title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {plantType.enriched_at && (
                    <p className="text-xs text-muted-foreground">
                      Last updated:{" "}
                      {new Date(plantType.enriched_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLinking || isPending}
                  className="gap-1"
                >
                  {isLinking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {/* Search section */}
          {!isLinked && (
            <>
              <div className="space-y-2">
                <Label htmlFor="wikidata-search">Search Wikidata</Label>
                <div className="flex gap-2">
                  <Input
                    id="wikidata-search"
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

              {/* Search error */}
              {searchError && (
                <p className="text-sm text-destructive">{searchError}</p>
              )}

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Select a result to link</Label>
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.qid}
                        onClick={() => setSelectedResult(result)}
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

              {/* Selected result & import options */}
              {selectedResult && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Link to: {selectedResult.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedResult.qid}
                        {selectedResult.scientificName &&
                          ` • ${selectedResult.scientificName}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedResult(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label>Import options</Label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importScientificName}
                        onChange={(e) => setImportScientificName(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">
                        Import scientific name
                        {selectedResult.scientificName && (
                          <span className="ml-1 text-muted-foreground">
                            ({selectedResult.scientificName})
                          </span>
                        )}
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importDescription}
                        onChange={(e) => setImportDescription(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">
                        Import description from Wikipedia
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overwriteMode}
                        onChange={(e) => setOverwriteMode(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">
                        Overwrite existing values (default: fill empty only)
                      </span>
                    </label>
                  </div>

                  <Button
                    onClick={handleLink}
                    disabled={isLinking || isPending}
                    className="w-full gap-2"
                  >
                    {isLinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LinkIcon className="h-4 w-4" />
                    )}
                    Link and Import
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Errors and success */}
          {linkError && (
            <p className="text-sm text-destructive">{linkError}</p>
          )}

          {linkSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Successfully linked and imported data!
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
