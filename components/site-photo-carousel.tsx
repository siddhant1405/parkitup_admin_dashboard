"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SitePhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">
        <ImageOff className="size-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- mock data: photos are data URIs, not remote-optimizable images */}
        <img src={photos[index]} alt={alt} className="size-full object-cover" />
        {photos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 size-8 -translate-y-1/2 rounded-full opacity-90"
              onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-full opacity-90"
              onClick={() => setIndex((i) => (i + 1) % photos.length)}
              aria-label="Next photo"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-md border-2",
                i === index ? "border-primary" : "border-transparent"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- mock data: photos are data URIs, not remote-optimizable images */}
              <img src={photo} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
