"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthMetric {
  label: string;
  value: string;
  percentage: string;
  description?: string;
}

export function HealthMetricCard({ metric }: { metric: HealthMetric }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{metric.value}</div>
          <div className="text-sm font-medium text-muted-foreground">{metric.percentage}</div>
          {metric.description && (
            <div className="text-xs text-muted-foreground">{metric.description}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
