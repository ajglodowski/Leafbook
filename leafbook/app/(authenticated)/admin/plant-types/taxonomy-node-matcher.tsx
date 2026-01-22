"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Check, X, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface WikidataSearchResult {
  qid: string;
  label: string;
  description: string | null;
  scientificName: string | null;
  rank: string | null;
}

export interface TaxonomyNodeMatch {
  index: number;
  qid: string;
  label: string;
  rank: string | null;
}

interface TaxonomyNodeMatcherProps {
  nodes: string[];
  onMatchChange: (match: TaxonomyNodeMatch | null) => void;
  selectedMatch: TaxonomyNodeMatch | null;
}

/**
 * Component for matching taxonomy path nodes to Wikidata.
 * Searches from the deepest node (leaf) upward and suggests the deepest match.
 * User must reject the suggested match to see options for higher nodes.
 */
export function TaxonomyNodeMatcher({
  nodes,
  onMatchChange,
  selectedMatch,
}: TaxonomyNodeMatcherProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number | null>(null);
  const [suggestedMatch, setSuggestedMatch] = useState<{
    index: number;
    results: WikidataSearchResult[];
  } | null>(null);
  const [rejectedIndices, setRejectedIndices] = useState<Set<number>>(new Set());
  const [manualSearchIndex, setManualSearchIndex] = useState<number | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [manualSearchResults, setManualSearchResults] = useState<WikidataSearchResult[]>([]);
  const [isManualSearching, setIsManualSearching] = useState(false);

  // Reset state when nodes change
  useEffect(() => {
    setSuggestedMatch(null);
    setRejectedIndices(new Set());
    setManualSearchIndex(null);
    setManualSearchResults([]);
    onMatchChange(null);
  }, [nodes.join(","), onMatchChange]);

  // Auto-search from deepest node when nodes change
  const searchFromDeepest = useCallback(async () => {
    if (nodes.length < 2) return;

    setIsSearching(true);
    setSuggestedMatch(null);

    // Start from the deepest (last) node and work upward
    for (let i = nodes.length - 1; i >= 0; i--) {
      // Skip if this index was already rejected
      if (rejectedIndices.has(i)) continue;

      setCurrentSearchIndex(i);
      const nodeName = nodes[i];

      try {
        const response = await fetch(
          `/api/admin/wikidata/search?q=${encodeURIComponent(nodeName)}&type=taxon`
        );
        const data = await response.json();

        if (response.ok && data.results && data.results.length > 0) {
          // Found matches for this node - suggest it
          setSuggestedMatch({ index: i, results: data.results });
          setIsSearching(false);
          setCurrentSearchIndex(null);
          return;
        }
      } catch (error) {
        console.error("Error searching Wikidata:", error);
      }
    }

    // No matches found at any level
    setIsSearching(false);
    setCurrentSearchIndex(null);
  }, [nodes, rejectedIndices]);

  // Trigger auto-search when nodes are available
  useEffect(() => {
    if (nodes.length >= 2 && !selectedMatch) {
      searchFromDeepest();
    }
  }, [nodes, selectedMatch, searchFromDeepest]);

  function handleAcceptMatch(result: WikidataSearchResult, index: number) {
    const match: TaxonomyNodeMatch = {
      index,
      qid: result.qid,
      label: result.label,
      rank: result.rank,
    };
    onMatchChange(match);
    setSuggestedMatch(null);
    setManualSearchIndex(null);
    setManualSearchResults([]);
  }

  function handleRejectSuggestedMatch() {
    if (!suggestedMatch) return;

    // Add the current suggested index to rejected set
    const newRejected = new Set(rejectedIndices);
    newRejected.add(suggestedMatch.index);
    setRejectedIndices(newRejected);
    setSuggestedMatch(null);

    // Search again from the next higher node
    // The useEffect will trigger searchFromDeepest with updated rejectedIndices
  }

  function handleClearMatch() {
    onMatchChange(null);
    setRejectedIndices(new Set());
    // Trigger new search
    searchFromDeepest();
  }

  async function handleManualSearch() {
    if (!manualSearchQuery.trim() || manualSearchIndex === null) return;

    setIsManualSearching(true);
    setManualSearchResults([]);

    try {
      const response = await fetch(
        `/api/admin/wikidata/search?q=${encodeURIComponent(manualSearchQuery.trim())}&type=taxon`
      );
      const data = await response.json();

      if (response.ok && data.results) {
        setManualSearchResults(data.results);
      }
    } catch (error) {
      console.error("Error in manual search:", error);
    } finally {
      setIsManualSearching(false);
    }
  }

  function handleOpenManualSearch(index: number) {
    setManualSearchIndex(index);
    setManualSearchQuery(nodes[index]);
    setManualSearchResults([]);
  }

  function handleCloseManualSearch() {
    setManualSearchIndex(null);
    setManualSearchQuery("");
    setManualSearchResults([]);
  }

  if (nodes.length < 2) {
    return null;
  }

  const deepestMatchIndex = selectedMatch?.index ?? suggestedMatch?.index ?? null;
  const manualNodesCount = deepestMatchIndex !== null ? nodes.length - 1 - deepestMatchIndex : nodes.length;

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Wikidata Matching</span>
          {selectedMatch && (
            <Badge variant="secondary" className="text-xs">
              Linked at {nodes[selectedMatch.index]}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-4">
            {/* Status / Current state */}
            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching Wikidata for {currentSearchIndex !== null ? `"${nodes[currentSearchIndex]}"` : "matches"}...
              </div>
            )}

            {/* Selected match display */}
            {selectedMatch && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Wikidata anchor selected
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearMatch}
                    className="h-6 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="rounded-md border bg-green-50 dark:bg-green-950/20 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{selectedMatch.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMatch.qid} • Node {selectedMatch.index + 1} of {nodes.length}
                      </p>
                      {selectedMatch.rank && (
                        <Badge variant="outline" className="mt-1 text-xs capitalize">
                          {selectedMatch.rank}
                        </Badge>
                      )}
                    </div>
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Wikidata will provide taxonomy from root to "{nodes[selectedMatch.index]}".
                  {manualNodesCount > 0 && (
                    <> {manualNodesCount} node{manualNodesCount > 1 ? "s" : ""} will be created manually below it.</>
                  )}
                </p>
              </div>
            )}

            {/* Suggested match (deepest found) */}
            {!selectedMatch && suggestedMatch && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Suggested Wikidata match (deepest found):
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Found at "{nodes[suggestedMatch.index]}" (node {suggestedMatch.index + 1} of {nodes.length}).
                  Accept to use Wikidata for taxonomy above this point.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {suggestedMatch.results.slice(0, 5).map((result) => (
                    <div
                      key={result.qid}
                      className="rounded-md border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{result.label}</p>
                          {result.scientificName && result.scientificName !== result.label && (
                            <p className="text-sm italic text-muted-foreground">
                              {result.scientificName}
                            </p>
                          )}
                          {result.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{result.qid}</span>
                            {result.rank && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {result.rank}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAcceptMatch(result, suggestedMatch.index)}
                          className="shrink-0"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRejectSuggestedMatch}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Not a match - try higher node
                  </Button>
                </div>
              </div>
            )}

            {/* No matches found */}
            {!selectedMatch && !suggestedMatch && !isSearching && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No Wikidata matches found automatically. All {nodes.length} nodes will be created manually.
                </p>
                <p className="text-xs text-muted-foreground">
                  You can manually search for a specific node below:
                </p>
                <div className="flex flex-wrap gap-2">
                  {nodes.map((node, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenManualSearch(index)}
                      className="text-xs"
                    >
                      <Search className="h-3 w-3 mr-1" />
                      {node}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual search for a specific node */}
            {manualSearchIndex !== null && (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Search for "{nodes[manualSearchIndex]}"
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseManualSearch}
                    className="h-6 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    placeholder="Search Wikidata..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleManualSearch();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleManualSearch}
                    disabled={isManualSearching || !manualSearchQuery.trim()}
                  >
                    {isManualSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {manualSearchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {manualSearchResults.slice(0, 5).map((result) => (
                      <div
                        key={result.qid}
                        className="rounded-md border p-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{result.label}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{result.qid}</span>
                              {result.rank && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {result.rank}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAcceptMatch(result, manualSearchIndex)}
                            className="shrink-0 h-7 text-xs"
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Visual path display */}
            {(selectedMatch || suggestedMatch) && (
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">Taxonomy path breakdown:</p>
                <div className="flex flex-wrap items-center gap-1">
                  {nodes.map((node, index) => {
                    const matchIndex = selectedMatch?.index ?? suggestedMatch?.index ?? -1;
                    const isWikidata = index <= matchIndex;
                    const isAnchor = index === matchIndex;
                    return (
                      <div key={index} className="flex items-center gap-1">
                        {index > 0 && <span className="text-muted-foreground">→</span>}
                        <Badge
                          variant={isAnchor ? "default" : isWikidata ? "secondary" : "outline"}
                          className={`text-xs ${isAnchor ? "ring-2 ring-primary/30" : ""}`}
                        >
                          {node}
                          {isWikidata && !isAnchor && (
                            <Link2 className="h-2.5 w-2.5 ml-1 opacity-60" />
                          )}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <Badge variant="secondary" className="text-xs mr-1">Gray</Badge> = from Wikidata,
                  <Badge variant="outline" className="text-xs ml-2 mr-1">Outlined</Badge> = created manually
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
