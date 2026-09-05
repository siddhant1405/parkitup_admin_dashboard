"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteMap } from "@/components/map/site-map";
import type { Site } from "@/lib/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function FullscreenMapCard({ sites }: { sites: Site[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen request failed:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!API_KEY) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center text-center text-muted-foreground">
            Google Maps API key is not configured.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={containerRef}
      className={isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}
    >
      <CardHeader className={isFullscreen ? "relative" : ""}>
        <div className="flex items-center justify-between">
          <CardTitle>Map</CardTitle>
          <button
            onClick={handleFullscreen}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle fullscreen"
            title="Toggle fullscreen"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className={isFullscreen ? "absolute inset-14 bottom-0 left-0 right-0 top-14" : ""}>
        <div className={isFullscreen ? "size-full" : "h-96 w-full"}>
          <APIProvider apiKey={API_KEY}>
            <SiteMap sites={sites} />
          </APIProvider>
        </div>
      </CardContent>
    </Card>
  );
}
