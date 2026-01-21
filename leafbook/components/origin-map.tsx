"use client";

import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Leaf, HelpCircle } from "lucide-react";
import type { OriginStats } from "@/lib/queries/plants";
import { getCountryName } from "@/lib/origin-mapping";

// World map topology JSON URL (Natural Earth)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface OriginMapProps {
  stats: OriginStats;
}

// Color scale based on plant count
function getCountryColor(count: number, maxCount: number): string {
  if (count === 0) return "hsl(var(--muted))";
  
  // Scale from light green to dark green based on count
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  const lightness = 75 - (intensity * 40); // 75% to 35%
  return `hsl(142, 70%, ${lightness}%)`;
}

export function OriginMap({ stats }: OriginMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{
    country: string;
    count: number;
    plants: { id: string; name: string }[];
  } | null>(null);

  // Get max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(stats.countries).map(c => c.count), 1);
  }, [stats.countries]);

  // Map ISO 3166-1 alpha-2 to country names in the topojson
  // The world-atlas uses numeric codes, so we need a lookup
  const countryCodeToName: Record<string, string> = useMemo(() => {
    const codes: Record<string, string> = {};
    Object.keys(stats.countries).forEach(code => {
      codes[code] = getCountryName(code);
    });
    return codes;
  }, [stats.countries]);

  // Find country data by name
  function getCountryDataByName(name: string) {
    // Try to match by looking up our country codes
    for (const [code, countryName] of Object.entries(countryCodeToName)) {
      if (name.toLowerCase().includes(countryName.toLowerCase()) || 
          countryName.toLowerCase().includes(name.toLowerCase())) {
        return { code, ...stats.countries[code] };
      }
    }
    return null;
  }

  // Region summary
  const regionSummary = useMemo(() => {
    return Object.entries(stats.regions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [stats.regions]);

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{Object.keys(stats.countries).length}</p>
              <p className="text-sm text-muted-foreground">Countries</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{Object.keys(stats.regions).length}</p>
              <p className="text-sm text-muted-foreground">Regions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.totalWithOrigin}</p>
              <p className="text-sm text-muted-foreground">Plants with origin</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Plant Origins Around the World
          </CardTitle>
          <CardDescription>
            Hover over highlighted countries to see your plants from each region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-2/1 w-full overflow-hidden rounded-lg border bg-muted/30">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 120,
                center: [0, 30],
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryData = getCountryDataByName(geo.properties.name);
                      const count = countryData?.count || 0;
                      const isHovered = hoveredCountry === geo.properties.name;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            setHoveredCountry(geo.properties.name);
                            if (countryData) {
                              setTooltipContent({
                                country: geo.properties.name,
                                count: countryData.count,
                                plants: countryData.plants,
                              });
                            } else {
                              setTooltipContent(null);
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredCountry(null);
                            setTooltipContent(null);
                          }}
                          style={{
                            default: {
                              fill: getCountryColor(count, maxCount),
                              stroke: "hsl(var(--border))",
                              strokeWidth: 0.5,
                              outline: "none",
                            },
                            hover: {
                              fill: count > 0 
                                ? "hsl(142, 80%, 45%)" 
                                : "hsl(var(--muted-foreground)/0.3)",
                              stroke: "hsl(var(--foreground))",
                              strokeWidth: 1,
                              outline: "none",
                              cursor: count > 0 ? "pointer" : "default",
                            },
                            pressed: {
                              fill: count > 0 
                                ? "hsl(142, 80%, 40%)" 
                                : "hsl(var(--muted))",
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {/* Tooltip */}
            {tooltipContent && (
              <div className="absolute bottom-4 left-4 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
                <p className="font-medium">{tooltipContent.country}</p>
                <p className="text-sm text-muted-foreground">
                  {tooltipContent.count} plant{tooltipContent.count !== 1 ? "s" : ""}
                </p>
                <div className="mt-2 max-h-24 space-y-1 overflow-y-auto">
                  {tooltipContent.plants.slice(0, 5).map((plant) => (
                    <p key={plant.id} className="text-xs text-muted-foreground">
                      {plant.name}
                    </p>
                  ))}
                  {tooltipContent.plants.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{tooltipContent.plants.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Region breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Region</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regionSummary.length > 0 ? (
                regionSummary.map(([region, count]) => (
                  <div key={region} className="flex items-center justify-between">
                    <span className="text-sm">{region}</span>
                    <Badge variant="secondary">{count} plant{count !== 1 ? "s" : ""}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No origin data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.countries).length > 0 ? (
                Object.entries(stats.countries)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 5)
                  .map(([code, data]) => (
                    <div key={code} className="flex items-center justify-between">
                      <span className="text-sm">{getCountryName(code)}</span>
                      <Badge variant="secondary">{data.count} plant{data.count !== 1 ? "s" : ""}</Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">No origin data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unknown origin notice */}
      {stats.totalWithoutOrigin > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 pt-6">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {stats.totalWithoutOrigin} plant{stats.totalWithoutOrigin !== 1 ? "s" : ""} {stats.totalWithoutOrigin !== 1 ? "don't" : "doesn't"} have origin data. 
              Add plant types with origin information to see them on the map.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
