"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface LocationData {
  area: string;
  count: number;
}

export function SitesByLocationCard({ data }: { data: LocationData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sites by location</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sites yet.</p>
        ) : (
          <div className="space-y-2">
            {data.map((location) => (
              <div key={location.area} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{location.area}</span>
                <span className="font-medium text-muted-foreground">{location.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
