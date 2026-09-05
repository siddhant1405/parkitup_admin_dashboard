"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InternetQuality } from "@/lib/types";

export interface ConnectivityTierData {
  tier: InternetQuality;
  label: string;
  count: number;
}

export function ConnectivityBreakdownCard({ data }: { data: ConnectivityTierData[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Connectivity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((tier) => (
            <div key={tier.tier} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{tier.label}</span>
              <span className="font-medium text-muted-foreground">{tier.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
