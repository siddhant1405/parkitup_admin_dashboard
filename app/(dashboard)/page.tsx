"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { PortfolioKpiRow } from "@/components/kpi/portfolio-kpi-row";
import { HealthMetricCard } from "@/components/kpi/portfolio-health-row";
import { ParkingTypeChart } from "@/components/kpi/parking-type-chart";
import { SitesByLocationCard } from "@/components/kpi/sites-by-location-card";
import { ConnectivityBreakdownCard } from "@/components/kpi/connectivity-breakdown-card";
import { FullscreenMapCard } from "@/components/kpi/fullscreen-map-card";
import { WeeklyActivationsChart } from "@/components/kpi/weekly-activations-chart";
import { useSites } from "@/lib/queries";
import { computeOverviewKpis, computeWeeklyActivations } from "@/lib/kpi";

export default function OverviewPage() {
  const { data: sites, isLoading } = useSites();

  if (isLoading || !sites) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const kpis = computeOverviewKpis(sites);
  const weeklyActivations = computeWeeklyActivations(sites);

  // Calculate health metrics percentages
  const securityPct =
    kpis.totalActive === 0 ? 0 : Math.round((kpis.securityCoveredCount / kpis.totalActive) * 100);

  const securityMetric = {
    label: "Security coverage",
    value: `${kpis.securityCoveredCount}/${kpis.totalActive}`,
    percentage: `${securityPct}%`,
  };
  const digitalPaymentMetric = {
    label: "Digital payment adoption",
    value: `${kpis.digitalPaymentAdoptionPct}%`,
    percentage: "",
  };
  const flaggedRisksMetric = {
    label: "Flagged risks",
    value: `${kpis.flaggedRiskCount} site${kpis.flaggedRiskCount === 1 ? "" : "s"}`,
    percentage: "",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      </div>

      {/* Portfolio KPI Row */}
      <PortfolioKpiRow
        totalSites={kpis.totalSites}
        activeSites={kpis.totalActive}
        inactiveSites={kpis.totalInactive}
        deletedSites={kpis.deletedCount}
        totalCapacity={kpis.totalCapacity}
        totalOperators={kpis.totalOperators}
        avgHourlyTicketPrice={kpis.avgHourlyTicketPrice}
        hourlyPricedSiteCount={kpis.hourlyPricedSiteCount}
        avgSlotsPerSite={kpis.avgSlotsPerSite}
      />

      {/* Composition Section */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Composition
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <ParkingTypeChart data={kpis.byParkingTypeActive} />
          <SitesByLocationCard data={kpis.byLocationActive} />
        </div>
      </section>

      {/* Portfolio Health Section */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Portfolio Health
        </h2>
        <p className="-mt-2 text-xs text-muted-foreground">Scoped to active sites only.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HealthMetricCard metric={securityMetric} />
          <ConnectivityBreakdownCard data={kpis.connectivityByTier} />
          <HealthMetricCard metric={digitalPaymentMetric} />
          <HealthMetricCard metric={flaggedRisksMetric} />
        </div>
      </section>

      {/* Sites Activated Over Time */}
      <WeeklyActivationsChart buckets={weeklyActivations} />

      {/* Map */}
      <FullscreenMapCard sites={kpis.activeSites} />
    </div>
  );
}
