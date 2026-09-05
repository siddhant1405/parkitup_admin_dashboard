"use client";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import {
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasMissingSecurityCoverage } from "@/lib/format";
import { NEEDS_ATTENTION_RING_COLOR, PARKING_TYPE_COLORS } from "@/lib/map-colors";
import { StatusBadge } from "@/components/status-badge";
import type { Site } from "@/lib/types";

const DELHI_CENTER = { lat: 22.5, lng: 78.5 };
const DEFAULT_ZOOM = 5;

function isNeedsAttention(site: Site): boolean {
  return site.riskFactors.length > 0 || hasMissingSecurityCoverage(site.security);
}

function SiteMarker({
  site,
  onSelect,
  setMarkerRef,
}: {
  site: Site;
  onSelect: (site: Site) => void;
  setMarkerRef: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void;
}) {
  const flagged = isNeedsAttention(site);
  const color = PARKING_TYPE_COLORS[site.parkingConfiguration.parkingType];

  return (
    <AdvancedMarker
      position={{ lat: site.lat, lng: site.lng }}
      ref={(marker) => setMarkerRef(marker, site.id)}
      onClick={() => onSelect(site)}
    >
      <Pin
        background={color}
        borderColor={flagged ? NEEDS_ATTENTION_RING_COLOR : color}
        glyphColor="#fff"
        scale={flagged ? 1.15 : 1}
      />
    </AdvancedMarker>
  );
}

export function SiteMap({ sites }: { sites: Site[] }) {
  const map = useMap();
  const [selected, setSelected] = useState<Site | null>(null);
  const markersRef = useRef<Record<string, google.maps.marker.AdvancedMarkerElement>>({});
  const clustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map || sites.length === 0) return;
    if (sites.length === 1) {
      map.setCenter({ lat: sites[0].lat, lng: sites[0].lng });
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const site of sites) {
      bounds.extend({ lat: site.lat, lng: site.lng });
    }
    map.fitBounds(bounds, 48);
  }, [map, sites]);

  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
      if (marker) {
        markersRef.current[id] = marker;
      } else {
        delete markersRef.current[id];
      }
    },
    []
  );

  useEffect(() => {
    if (!map) return;
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map });
    }
  }, [map]);

  useEffect(() => {
    const clusterer = clustererRef.current;
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markersRef.current) as unknown as Marker[]);
  }, [sites]);

  return (
    <Map
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
      defaultCenter={DELHI_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      disableDefaultUI={false}
      className="size-full"
      colorScheme="FOLLOW_SYSTEM"
    >
      {sites.map((site) => (
        <SiteMarker key={site.id} site={site} onSelect={setSelected} setMarkerRef={setMarkerRef} />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="min-w-48 max-w-64 space-y-1 text-sm text-neutral-900">
            <div className="font-semibold">{selected.propertyName}</div>
            <div className="text-xs text-neutral-600">{selected.address}</div>
            <div className="pt-1">
              <StatusBadge status={selected.status} />
            </div>
            <Link
              href={`/sites/${selected.id}`}
              className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              View details →
            </Link>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}
