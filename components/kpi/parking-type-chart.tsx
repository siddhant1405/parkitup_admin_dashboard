"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PARKING_TYPE_LABELS } from "@/lib/format";
import { PARKING_TYPE_COLORS } from "@/lib/map-colors";
import type { ParkingTypeCount } from "@/lib/kpi";

export function ParkingTypeChart({ data }: { data: ParkingTypeCount[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: PARKING_TYPE_LABELS[d.parkingType],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sites by parking type</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sites yet.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "var(--viz-grid)" }}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--popover-foreground)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry) => (
                    <Cell key={entry.parkingType} fill={PARKING_TYPE_COLORS[entry.parkingType]} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill="var(--foreground)"
                    fontSize={14}
                    fontWeight={500}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
