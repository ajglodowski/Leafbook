"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
} from "lucide-react";
import { useState } from "react";

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

type OriginData = { country_code: string; region: string | null };

interface WikidataSearchProps {
  onSelect: (data: {
    name: string;
    scientificName: string | null;
    description: string | null;
    qid: string;
    wikipediaTitle: string | null;
    origins: OriginData[];
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

  async function handleSelectResult(result: WikidataSearchResult) {
    setSelectedResult(result);
    
    // Fetch additional details including origin data
    await fetchEntityDetails(result);
  }

  async function fetchEntityDetails(result: WikidataSearchResult) {
    let description = result.description;
    const wikidataOrigins: OriginData[] = [];
    const wikipediaOrigins: OriginData[] = [];

    // Fetch Wikipedia description if available
    if (result.wikipediaTitle) {
      try {
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.wikipediaTitle.replace(/ /g, "_"))}`
        );
        if (response.ok) {
          const data = await response.json();
          description = data.extract || result.description;
        }
      } catch {
        // Keep original description
      }
    }

    // 1. Try Wikidata claims for origin data
    try {
      const entityResponse = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${result.qid}&languages=en&props=claims&format=json&origin=*`);
      if (entityResponse.ok) {
        const entityData = await entityResponse.json();
        const entity = entityData.entities?.[result.qid];
        
        if (entity?.claims) {
          // Collect all QIDs from P9714 (native range) and P183 (endemic to)
          const locationQids: string[] = [];
          
          // P9714 - native range
          const nativeRangeClaims = entity.claims.P9714 || [];
          for (const claim of nativeRangeClaims) {
            const qid = claim?.mainsnak?.datavalue?.value?.id;
            if (qid) locationQids.push(qid);
          }
          
          // P183 - endemic to (fallback if no native range)
          if (locationQids.length === 0) {
            const endemicClaims = entity.claims.P183 || [];
            for (const claim of endemicClaims) {
              const qid = claim?.mainsnak?.datavalue?.value?.id;
              if (qid) locationQids.push(qid);
            }
          }
          
          // Resolve each location QID to country codes
          for (const locQid of locationQids) {
            const countryData = await resolveQidToCountryCode(locQid);
            if (countryData && !wikidataOrigins.some(o => o.country_code === countryData.code)) {
              wikidataOrigins.push({ country_code: countryData.code, region: countryData.region });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching entity details:", error);
    }

    // 2. Always try to parse Wikipedia summary for country mentions
    if (description) {
      const parsedOrigins = parseCountriesFromText(description);
      for (const origin of parsedOrigins) {
        if (!wikipediaOrigins.some(o => o.country_code === origin.country_code)) {
          wikipediaOrigins.push(origin);
        }
      }
    }

    // 3. Smart merge: prefer Wikipedia if it found significantly more countries
    // or if the regions don't match (suggesting Wikidata might be wrong)
    let origins: OriginData[] = [];
    
    if (wikipediaOrigins.length === 0) {
      origins = wikidataOrigins;
    } else if (wikidataOrigins.length === 0) {
      origins = wikipediaOrigins;
    } else {
      // Both have data - check for conflicts
      const wikiRegions = new Set(wikidataOrigins.map(o => o.region).filter(Boolean));
      const wpRegions = new Set(wikipediaOrigins.map(o => o.region).filter(Boolean));
      
      // Check if regions overlap
      const hasOverlap = [...wikiRegions].some(r => wpRegions.has(r));
      
      if (!hasOverlap && wikipediaOrigins.length >= 3) {
        // Regions don't overlap and Wikipedia found multiple countries
        // Wikidata is likely wrong - prefer Wikipedia data
        origins = wikipediaOrigins;
      } else if (wikipediaOrigins.length >= wikidataOrigins.length * 3) {
        // Wikipedia found many more countries - likely more accurate
        origins = wikipediaOrigins;
      } else {
        // Merge both sources
        origins = [...wikidataOrigins];
        for (const wpOrigin of wikipediaOrigins) {
          if (!origins.some(o => o.country_code === wpOrigin.country_code)) {
            origins.push(wpOrigin);
          }
        }
      }
    }

    onSelect({
      name: result.label,
      scientificName: result.scientificName,
      description,
      qid: result.qid,
      wikipediaTitle: result.wikipediaTitle,
      origins,
    });
  }

  // Parse country names from text (Wikipedia summary fallback)
  // Returns countries mentioned, or representative countries for regions if only region is mentioned
  function parseCountriesFromText(text: string): OriginData[] {
    // Regional indicators when Wikipedia says "native to western Africa" etc.
    const REGION_INDICATORS: Array<{ pattern: RegExp; representative: { code: string; region: string }[] }> = [
      { 
        pattern: /\b(?:west(?:ern)?\s+Africa|tropical\s+(?:west(?:ern)?\s+)?Africa)\b/i, 
        representative: [
          { code: "NG", region: "Africa" },
          { code: "GH", region: "Africa" },
          { code: "CI", region: "Africa" },
        ]
      },
      { 
        pattern: /\beast(?:ern)?\s+Africa\b/i, 
        representative: [
          { code: "KE", region: "Africa" },
          { code: "TZ", region: "Africa" },
        ]
      },
      { 
        pattern: /\bsouthern\s+Africa\b/i, 
        representative: [
          { code: "ZA", region: "Africa" },
        ]
      },
      { 
        pattern: /\bsouth(?:east(?:ern)?|[\s-]?east)\s+Asia\b/i, 
        representative: [
          { code: "TH", region: "Asia" },
          { code: "VN", region: "Asia" },
          { code: "MY", region: "Asia" },
        ]
      },
      { 
        pattern: /\b(?:central|south)\s+America\b/i, 
        representative: [
          { code: "BR", region: "South America" },
          { code: "CO", region: "South America" },
        ]
      },
    ];

    const COUNTRY_PATTERNS: Array<{ pattern: RegExp; code: string; region: string }> = [
      // Africa - comprehensive list for tropical/plant origins
      { pattern: /\bSouth Africa\b/i, code: "ZA", region: "Africa" },
      { pattern: /\bMadagascar\b/i, code: "MG", region: "Africa" },
      { pattern: /\bKenya\b/i, code: "KE", region: "Africa" },
      { pattern: /\bTanzania\b/i, code: "TZ", region: "Africa" },
      { pattern: /\bEgypt\b/i, code: "EG", region: "Africa" },
      { pattern: /\bMorocco\b/i, code: "MA", region: "Africa" },
      { pattern: /\bNigeria\b/i, code: "NG", region: "Africa" },
      { pattern: /\bEthiopia\b/i, code: "ET", region: "Africa" },
      { pattern: /\bBenin\b/i, code: "BJ", region: "Africa" },
      { pattern: /\bCameroon\b/i, code: "CM", region: "Africa" },
      { pattern: /\bGabon\b/i, code: "GA", region: "Africa" },
      { pattern: /\bGhana\b/i, code: "GH", region: "Africa" },
      { pattern: /\bGuinea-Bissau\b/i, code: "GW", region: "Africa" },
      { pattern: /\bGuinea\b/i, code: "GN", region: "Africa" },
      { pattern: /\bIvory Coast\b/i, code: "CI", region: "Africa" },
      { pattern: /\bCôte d'Ivoire\b/i, code: "CI", region: "Africa" },
      { pattern: /\bLiberia\b/i, code: "LR", region: "Africa" },
      { pattern: /\bSierra Leone\b/i, code: "SL", region: "Africa" },
      { pattern: /\bTogo\b/i, code: "TG", region: "Africa" },
      { pattern: /\bSenegal\b/i, code: "SN", region: "Africa" },
      { pattern: /\bMali\b/i, code: "ML", region: "Africa" },
      { pattern: /\bBurkina Faso\b/i, code: "BF", region: "Africa" },
      { pattern: /\bNiger\b/i, code: "NE", region: "Africa" },
      { pattern: /\bCongo\b/i, code: "CG", region: "Africa" },
      { pattern: /\bDemocratic Republic of the Congo\b/i, code: "CD", region: "Africa" },
      { pattern: /\bUganda\b/i, code: "UG", region: "Africa" },
      { pattern: /\bRwanda\b/i, code: "RW", region: "Africa" },
      { pattern: /\bBurundi\b/i, code: "BI", region: "Africa" },
      { pattern: /\bAngola\b/i, code: "AO", region: "Africa" },
      { pattern: /\bZambia\b/i, code: "ZM", region: "Africa" },
      { pattern: /\bZimbabwe\b/i, code: "ZW", region: "Africa" },
      { pattern: /\bMozambique\b/i, code: "MZ", region: "Africa" },
      { pattern: /\bMalawi\b/i, code: "MW", region: "Africa" },
      { pattern: /\bNamibia\b/i, code: "NA", region: "Africa" },
      { pattern: /\bBotswana\b/i, code: "BW", region: "Africa" },
      // Asia
      { pattern: /\bChina\b/i, code: "CN", region: "Asia" },
      { pattern: /\bJapan\b/i, code: "JP", region: "Asia" },
      { pattern: /\bIndia\b/i, code: "IN", region: "Asia" },
      { pattern: /\bThailand\b/i, code: "TH", region: "Asia" },
      { pattern: /\bVietnam\b/i, code: "VN", region: "Asia" },
      { pattern: /\bMalaysia\b/i, code: "MY", region: "Asia" },
      { pattern: /\bIndonesia\b/i, code: "ID", region: "Asia" },
      { pattern: /\bPhilippines\b/i, code: "PH", region: "Asia" },
      { pattern: /\bSouth Korea\b/i, code: "KR", region: "Asia" },
      { pattern: /\bTaiwan\b/i, code: "TW", region: "Asia" },
      { pattern: /\bSingapore\b/i, code: "SG", region: "Asia" },
      { pattern: /\bMyanmar\b/i, code: "MM", region: "Asia" },
      { pattern: /\bNepal\b/i, code: "NP", region: "Asia" },
      { pattern: /\bSri Lanka\b/i, code: "LK", region: "Asia" },
      { pattern: /\bBrazil\b/i, code: "BR", region: "South America" },
      { pattern: /\bArgentina\b/i, code: "AR", region: "South America" },
      { pattern: /\bColombia\b/i, code: "CO", region: "South America" },
      { pattern: /\bPeru\b/i, code: "PE", region: "South America" },
      { pattern: /\bChile\b/i, code: "CL", region: "South America" },
      { pattern: /\bEcuador\b/i, code: "EC", region: "South America" },
      { pattern: /\bVenezuela\b/i, code: "VE", region: "South America" },
      { pattern: /\bBolivia\b/i, code: "BO", region: "South America" },
      { pattern: /\bAustralia\b/i, code: "AU", region: "Oceania" },
      { pattern: /\bNew Zealand\b/i, code: "NZ", region: "Oceania" },
      { pattern: /\bUnited States\b/i, code: "US", region: "North America" },
      { pattern: /\bCanada\b/i, code: "CA", region: "North America" },
      { pattern: /\bMexico\b/i, code: "MX", region: "North America" },
      { pattern: /\bGuatemala\b/i, code: "GT", region: "North America" },
      { pattern: /\bCosta Rica\b/i, code: "CR", region: "North America" },
      { pattern: /\bUnited Kingdom\b/i, code: "GB", region: "Europe" },
      { pattern: /\bFrance\b/i, code: "FR", region: "Europe" },
      { pattern: /\bGermany\b/i, code: "DE", region: "Europe" },
      { pattern: /\bItaly\b/i, code: "IT", region: "Europe" },
      { pattern: /\bSpain\b/i, code: "ES", region: "Europe" },
      { pattern: /\bPortugal\b/i, code: "PT", region: "Europe" },
      { pattern: /\bGreece\b/i, code: "GR", region: "Europe" },
    ];

    const found: OriginData[] = [];
    
    // First, check for specific country mentions
    for (const { pattern, code, region } of COUNTRY_PATTERNS) {
      if (pattern.test(text) && !found.some(o => o.country_code === code)) {
        found.push({ country_code: code, region });
      }
    }
    
    // If no specific countries found, check for regional mentions
    if (found.length === 0) {
      for (const { pattern, representative } of REGION_INDICATORS) {
        if (pattern.test(text)) {
          for (const rep of representative) {
            if (!found.some(o => o.country_code === rep.code)) {
              found.push({ country_code: rep.code, region: rep.region });
            }
          }
          break; // Use first matching region
        }
      }
    }
    
    return found;
  }

  // Simple mapping of common country QIDs to ISO codes
  async function resolveQidToCountryCode(qid: string): Promise<{ code: string; region: string } | null> {
    const COUNTRY_MAP: Record<string, { code: string; region: string }> = {
      Q17: { code: "JP", region: "Asia" }, // Japan
      Q148: { code: "CN", region: "Asia" }, // China
      Q668: { code: "IN", region: "Asia" }, // India
      Q869: { code: "TH", region: "Asia" }, // Thailand
      Q881: { code: "VN", region: "Asia" }, // Vietnam
      Q833: { code: "MY", region: "Asia" }, // Malaysia
      Q252: { code: "ID", region: "Asia" }, // Indonesia
      Q928: { code: "PH", region: "Asia" }, // Philippines
      Q155: { code: "BR", region: "South America" }, // Brazil
      Q414: { code: "AR", region: "South America" }, // Argentina
      Q739: { code: "CO", region: "South America" }, // Colombia
      Q419: { code: "PE", region: "South America" }, // Peru
      Q298: { code: "CL", region: "South America" }, // Chile
      Q736: { code: "EC", region: "South America" }, // Ecuador
      Q258: { code: "ZA", region: "Africa" }, // South Africa
      Q1019: { code: "MG", region: "Africa" }, // Madagascar
      Q114: { code: "KE", region: "Africa" }, // Kenya
      Q408: { code: "AU", region: "Oceania" }, // Australia
      Q664: { code: "NZ", region: "Oceania" }, // New Zealand
      Q30: { code: "US", region: "North America" }, // United States
      Q16: { code: "CA", region: "North America" }, // Canada
      Q96: { code: "MX", region: "North America" }, // Mexico
      Q145: { code: "GB", region: "Europe" }, // United Kingdom
      Q142: { code: "FR", region: "Europe" }, // France
      Q183: { code: "DE", region: "Europe" }, // Germany
      Q38: { code: "IT", region: "Europe" }, // Italy
      Q29: { code: "ES", region: "Europe" }, // Spain
    };

    if (COUNTRY_MAP[qid]) {
      return COUNTRY_MAP[qid];
    }

    // Try to fetch the entity and check if it's a country or has a country property
    try {
      const response = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&languages=en&props=claims&format=json&origin=*`);
      if (response.ok) {
        const data = await response.json();
        const entity = data.entities?.[qid];
        // Check P17 (country) property
        const countryQid = entity?.claims?.P17?.[0]?.mainsnak?.datavalue?.value?.id;
        if (countryQid && COUNTRY_MAP[countryQid]) {
          return COUNTRY_MAP[countryQid];
        }
      }
    } catch {
      // Ignore errors
    }

    return null;
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
