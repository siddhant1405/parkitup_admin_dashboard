"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteMap } from "@/components/map/site-map";
import { MapLegend } from "@/components/map/map-legend";
import { useSites } from "@/lib/queries";
import { PARKING_TYPE_LABELS, hasMissingSecurityCoverage } from "@/lib/format";
import type { ParkingType } from "@/lib/types";
import { cn } from "@/lib/utils";

const PARKING_TYPES = Object.keys(PARKING_TYPE_LABELS) as ParkingType[];
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MapPage() {
  const { data: sites, isLoading } = useSites();
  const [activeTypes, setActiveTypes] = useState<Set<ParkingType>>(new Set(PARKING_TYPES));
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);

  const activeSites = useMemo(() => {
    if (!sites) return [];
    return sites.filter((site) => {
      if (site.status !== "active" || site.isDeleted) return false;
      if (!activeTypes.has(site.parkingConfiguration.parkingType)) return false;
      if (needsAttentionOnly) {
        const flagged =
          site.riskFactors.length > 0 || hasMissingSecurityCoverage(site.security);
        if (!flagged) return false;
      }
      return true;
    });
  }, [sites, activeTypes, needsAttentionOnly]);

  function toggleType(type: ParkingType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  if (!API_KEY) {
    return (
      <div className="flex h-full items-center justify-center text-center text-muted-foreground">
        Google Maps API key is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-3 md:h-[calc(100vh-4rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Map</h1>
          <p className="text-sm text-muted-foreground">
            {activeSites.length} active site{activeSites.length === 1 ? "" : "s"} shown
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PARKING_TYPES.map((type) => (
            <Button
              key={type}
              size="sm"
              variant="outline"
              className={cn(
                "h-8",
                activeTypes.has(type) && "border-primary bg-accent text-accent-foreground"
              )}
              onClick={() => toggleType(type)}
            >
              {PARKING_TYPE_LABELS[type]}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-8",
              needsAttentionOnly && "border-primary bg-accent text-accent-foreground"
            )}
            onClick={() => setNeedsAttentionOnly((v) => !v)}
          >
            Needs attention only
          </Button>
        </div>
      </div>

      <MapLegend />

      <div className="relative flex-1 overflow-hidden rounded-lg border">
        {isLoading ? (
          <Skeleton className="size-full" />
        ) : (
          <APIProvider apiKey={API_KEY}>
            <SiteMap sites={activeSites} />
          </APIProvider>
        )}
      </div>
    </div>
  );
}
