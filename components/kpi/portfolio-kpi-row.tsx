"use client";

import { StatTile } from "@/components/kpi/stat-tile";

export function PortfolioKpiRow({
  totalSites,
  activeSites,
  inactiveSites,
  deletedSites,
  totalCapacity,
  totalOperators,
  avgHourlyTicketPrice,
  hourlyPricedSiteCount,
  avgSlotsPerSite,
}: {
  totalSites: number;
  activeSites: number;
  inactiveSites: number;
  deletedSites: number;
  totalCapacity: number;
  totalOperators: number;
  avgHourlyTicketPrice: number;
  hourlyPricedSiteCount: number;
  avgSlotsPerSite: number;
}) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <StatTile label="Total sites" value={totalSites} />
      <StatTile label="Active sites" value={activeSites} />
      <StatTile label="Inactive sites" value={inactiveSites} />
      <StatTile label="Deleted sites" value={deletedSites} />
      <StatTile
        label="Total capacity"
        value={totalCapacity}
        sublabel="parking slots across all sites"
      />
      <StatTile label="Total operators" value={totalOperators} />
      <StatTile
        label="Avg. ticket price per site"
        value={`₹${avgHourlyTicketPrice}/hr`}
        sublabel={`based on ${hourlyPricedSiteCount} of ${totalSites} sites`}
      />
      <StatTile label="Avg. slots per site" value={avgSlotsPerSite.toFixed(1)} />
    </div>
  );
}
