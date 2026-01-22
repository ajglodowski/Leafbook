"use client";

import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, Map, ScrollText, Feather, Navigation } from "lucide-react";
import type { OriginStats } from "@/lib/queries/plants";
import { getCountryName } from "@/lib/origin-mapping";

// World map topology JSON URL (Natural Earth)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface OriginMapProps {
  stats: OriginStats;
}

// Muted earth-tone color scale based on plant count
function getCountryColor(count: number, maxCount: number, isDark: boolean): string {
  if (count === 0) {
    return isDark ? "hsl(40, 10%, 20%)" : "hsl(40, 20%, 94%)";
  }
  
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  if (isDark) {
    const l = 25 + (intensity * 20);
    return `hsl(150, 30%, ${l}%)`;
  }
  const l = 75 - (intensity * 35);
  return `hsl(150, 35%, ${l}%)`;
}

// Simple compass rose
function CompassRose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <polygon points="50,8 46,40 50,35 54,40" opacity="0.6" />
      <polygon points="50,92 46,60 50,65 54,60" opacity="0.25" />
      <polygon points="8,50 40,46 35,50 40,54" opacity="0.25" />
      <polygon points="92,50 60,46 65,50 60,54" opacity="0.25" />
      <circle cx="50" cy="50" r="4" opacity="0.4" />
      <text x="50" y="22" textAnchor="middle" fontSize="10" fontWeight="600" opacity="0.5">N</text>
    </svg>
  );
}

// Torn paper edge SVG - creates jagged edges on all sides
function TornPaperFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Top torn edge */}
      <svg className="absolute -top-2 left-0 right-0 h-3 w-full text-stone-100 dark:text-stone-900" preserveAspectRatio="none" viewBox="0 0 100 10">
        <path 
          d="M0,10 L0,3 L2,4 L4,2 L6,5 L8,3 L10,4 L12,2 L14,5 L16,3 L18,4 L20,2 L22,5 L24,3 L26,4 L28,2 L30,4 L32,3 L34,5 L36,2 L38,4 L40,3 L42,5 L44,2 L46,4 L48,3 L50,5 L52,2 L54,4 L56,3 L58,5 L60,2 L62,4 L64,3 L66,5 L68,2 L70,4 L72,3 L74,5 L76,2 L78,4 L80,3 L82,5 L84,2 L86,4 L88,3 L90,5 L92,2 L94,4 L96,3 L98,5 L100,3 L100,10 Z" 
          fill="currentColor"
        />
      </svg>
      
      {/* Bottom torn edge */}
      <svg className="absolute -bottom-2 left-0 right-0 h-3 w-full text-stone-100 dark:text-stone-900" preserveAspectRatio="none" viewBox="0 0 100 10">
        <path 
          d="M0,0 L0,7 L2,6 L4,8 L6,5 L8,7 L10,6 L12,8 L14,5 L16,7 L18,6 L20,8 L22,5 L24,7 L26,6 L28,8 L30,6 L32,7 L34,5 L36,8 L38,6 L40,7 L42,5 L44,8 L46,6 L48,7 L50,5 L52,8 L54,6 L56,7 L58,5 L60,8 L62,6 L64,7 L66,5 L68,8 L70,6 L72,7 L74,5 L76,8 L78,6 L80,7 L82,5 L84,8 L86,6 L88,7 L90,5 L92,8 L94,6 L96,7 L98,5 L100,7 L100,0 Z" 
          fill="currentColor"
        />
      </svg>
      
      {/* Left torn edge */}
      <svg className="absolute top-0 -left-2 bottom-0 h-full w-3 text-stone-100 dark:text-stone-900" preserveAspectRatio="none" viewBox="0 0 10 100">
        <path 
          d="M10,0 L3,0 L4,2 L2,4 L5,6 L3,8 L4,10 L2,12 L5,14 L3,16 L4,18 L2,20 L5,22 L3,24 L4,26 L2,28 L4,30 L3,32 L5,34 L2,36 L4,38 L3,40 L5,42 L2,44 L4,46 L3,48 L5,50 L2,52 L4,54 L3,56 L5,58 L2,60 L4,62 L3,64 L5,66 L2,68 L4,70 L3,72 L5,74 L2,76 L4,78 L3,80 L5,82 L2,84 L4,86 L3,88 L5,90 L2,92 L4,94 L3,96 L5,98 L3,100 L10,100 Z" 
          fill="currentColor"
        />
      </svg>
      
      {/* Right torn edge */}
      <svg className="absolute top-0 -right-2 bottom-0 h-full w-3 text-stone-100 dark:text-stone-900" preserveAspectRatio="none" viewBox="0 0 10 100">
        <path 
          d="M0,0 L7,0 L6,2 L8,4 L5,6 L7,8 L6,10 L8,12 L5,14 L7,16 L6,18 L8,20 L5,22 L7,24 L6,26 L8,28 L6,30 L7,32 L5,34 L8,36 L6,38 L7,40 L5,42 L8,44 L6,46 L7,48 L5,50 L8,52 L6,54 L7,56 L5,58 L8,60 L6,62 L7,64 L5,66 L8,68 L6,70 L7,72 L5,74 L8,76 L6,78 L7,80 L5,82 L8,84 L6,86 L7,88 L5,90 L8,92 L6,94 L7,96 L5,98 L7,100 L0,100 Z" 
          fill="currentColor"
        />
      </svg>
      
      {/* Content */}
      <div className="relative bg-stone-100 dark:bg-stone-900">
        {children}
      </div>
    </div>
  );
}

export function OriginMap({ stats }: OriginMapProps) {
  const [tooltipContent, setTooltipContent] = useState<{
    country: string;
    count: number;
    plants: { id: string; name: string }[];
  } | null>(null);

  const maxCount = useMemo(() => {
    return Math.max(...Object.values(stats.countries).map(c => c.count), 1);
  }, [stats.countries]);

  const countryCodeToName: Record<string, string> = useMemo(() => {
    const codes: Record<string, string> = {};
    Object.keys(stats.countries).forEach(code => {
      codes[code] = getCountryName(code);
    });
    return codes;
  }, [stats.countries]);

  function getCountryDataByName(name: string) {
    for (const [code, countryName] of Object.entries(countryCodeToName)) {
      if (name.toLowerCase().includes(countryName.toLowerCase()) || 
          countryName.toLowerCase().includes(name.toLowerCase())) {
        return { code, ...stats.countries[code] };
      }
    }
    return null;
  }

  const regionSummary = useMemo(() => {
    return Object.entries(stats.regions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [stats.regions]);

  const countriesList = useMemo(() => {
    return Object.entries(stats.countries)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6);
  }, [stats.countries]);

  const countriesExplored = Object.keys(stats.countries).length;
  const continentsCharted = Object.keys(stats.regions).length;

  return (
    <div className="space-y-4">
      {/* Compact header with inline stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
            <Navigation className="h-4 w-4 text-stone-600 dark:text-stone-300" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold">Botanical Expedition</h2>
            <p className="text-xs text-muted-foreground">Origins of your plant collection</p>
          </div>
        </div>
        
        {/* Inline stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-muted-foreground" />
            <span className="font-serif text-lg font-semibold">{countriesExplored}</span>
            <span className="text-xs text-muted-foreground">territories</span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <span className="font-serif text-lg font-semibold">{continentsCharted}</span>
            <span className="text-xs text-muted-foreground">continents</span>
          </div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            <span className="font-serif text-lg font-semibold">{stats.totalWithOrigin}</span>
            <span className="text-xs text-muted-foreground">specimens</span>
          </div>
        </div>
      </div>

      {/* Main content: Map with side panels */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Map with torn paper edges */}
        <TornPaperFrame className="mx-2 my-3">
          <div className="relative aspect-2/1 w-full bg-[hsl(40,20%,94%)] dark:bg-[hsl(40,10%,20%)]">
            {/* Compass rose watermark */}
            <div className="pointer-events-none absolute right-4 top-4 z-10 opacity-30">
              <CompassRose className="h-16 w-16 text-stone-500" />
            </div>
            
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 130,
                center: [0, 25],
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryData = getCountryDataByName(geo.properties.name);
                      const count = countryData?.count || 0;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
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
                          onMouseLeave={() => setTooltipContent(null)}
                          style={{
                            default: {
                              fill: getCountryColor(count, maxCount, false),
                              stroke: "#a8a29e",
                              strokeWidth: 0.4,
                              outline: "none",
                            },
                            hover: {
                              fill: count > 0 ? "hsl(150, 50%, 45%)" : "hsl(40, 15%, 88%)",
                              stroke: "#57534e",
                              strokeWidth: 1,
                              outline: "none",
                              cursor: count > 0 ? "pointer" : "default",
                            },
                            pressed: {
                              fill: count > 0 ? "hsl(150, 50%, 40%)" : "hsl(40, 15%, 85%)",
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
              <div className="absolute bottom-3 left-3 z-20 max-w-56 rounded-md border bg-background/95 p-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Feather className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-serif text-sm font-semibold">{tooltipContent.country}</p>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{tooltipContent.count}</span>{" "}
                  specimen{tooltipContent.count !== 1 ? "s" : ""}
                </p>
                <div className="mt-2 space-y-0.5">
                  {tooltipContent.plants.slice(0, 4).map((plant) => (
                    <p key={plant.id} className="truncate text-xs">• {plant.name}</p>
                  ))}
                  {tooltipContent.plants.length > 4 && (
                    <p className="text-xs text-muted-foreground">+{tooltipContent.plants.length - 4} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-3 right-3 flex items-center gap-3 rounded bg-background/80 px-2 py-1 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-sm bg-stone-200" />
                <span className="text-muted-foreground">Unexplored</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-sm bg-green-600/70" />
                <span className="text-muted-foreground">Origins</span>
              </div>
            </div>
          </div>
        </TornPaperFrame>

        {/* Side panel with regions and countries */}
        <div className="space-y-4">
          {/* Continents */}
          <Card size="sm" className="border-stone-200 dark:border-stone-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-serif">
                <Compass className="h-3.5 w-3.5 text-muted-foreground" />
                Continents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {regionSummary.length > 0 ? (
                  regionSummary.map(([region, count]) => (
                    <div key={region} className="flex items-center justify-between text-sm">
                      <span>{region}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-muted-foreground">No data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card size="sm" className="border-stone-200 dark:border-stone-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-serif">
                <Map className="h-3.5 w-3.5 text-muted-foreground" />
                Top Territories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {countriesList.length > 0 ? (
                  countriesList.map(([code, data]) => (
                    <div key={code} className="flex items-center justify-between text-sm">
                      <span className="truncate">{getCountryName(code)}</span>
                      <span className="text-xs text-muted-foreground">{data.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-muted-foreground">No data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Unknown origins */}
          {stats.totalWithoutOrigin > 0 && (
            <div className="rounded-md border border-dashed border-stone-300 p-3 dark:border-stone-700">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{stats.totalWithoutOrigin}</span>{" "}
                plant{stats.totalWithoutOrigin !== 1 ? "s" : ""} with unknown origins
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
