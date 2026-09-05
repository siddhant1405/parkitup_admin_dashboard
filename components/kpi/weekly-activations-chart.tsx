"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklyActivationBucket } from "@/lib/kpi";

function formatWeekLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function WeeklyActivationsChart({ buckets }: { buckets: WeeklyActivationBucket[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site activations over time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-3 border-b border-(--viz-grid) pb-0">
          {buckets.map((bucket, i) => {
            const heightPct = (bucket.count / max) * 100;
            return (
              <div key={bucket.weekStart} className="relative flex flex-1 flex-col items-center">
                {hovered === i && (
                  <div className="absolute -top-9 z-10 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                    <span className="font-semibold text-popover-foreground">{bucket.count}</span>
                    <span className="ml-1 text-muted-foreground">activated</span>
                  </div>
                )}
                <button
                  type="button"
                  className="w-full max-w-6 rounded-t-[4px] bg-(--viz-series-1) outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    height: `${Math.max(heightPct, bucket.count > 0 ? 4 : 0)}%`,
                    opacity: hovered === null || hovered === i ? 1 : 0.6,
                  }}
                  onPointerEnter={() => setHovered(i)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  aria-label={`Week of ${formatWeekLabel(bucket.weekStart)}: ${bucket.count} activated`}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
          {buckets.map((bucket, i) => (
            <div key={bucket.weekStart} className="flex-1 text-center">
              {i === 0 || i === buckets.length - 1 ? formatWeekLabel(bucket.weekStart) : ""}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
