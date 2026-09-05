import { getSiteLocality, hasMissingSecurityCoverage } from "./format";
import type { InternetQuality, ParkingType, Site } from "./types";

const CONNECTIVITY_TIER_LABELS: Record<InternetQuality, string> = {
  good: "Good",
  poor: "Poor",
  none: "Unavailable",
};

export interface ParkingTypeCount {
  parkingType: ParkingType;
  count: number;
}

export interface OverviewKpis {
  activeSites: Site[];
  totalSites: number;
  totalActive: number;
  totalInactive: number;
  deletedCount: number;
  totalCapacity: number;
  totalOperators: number;
  avgSlotsPerSite: number;
  avgHourlyTicketPrice: number;
  hourlyPricedSiteCount: number;

  // Composition charts (active sites only)
  byParkingTypeActive: ParkingTypeCount[];
  byLocationActive: { area: string; count: number }[];

  // Portfolio health metrics (active sites only)
  securityCoveredCount: number;
  connectivityByTier: { tier: InternetQuality; label: string; count: number }[];
  digitalPaymentAdoptionPct: number;
  flaggedRiskCount: number;
}

export function computeOverviewKpis(sites: Site[]): OverviewKpis {
  // Composition scope: real inventory, pipeline included, drafts and deleted excluded.
  const compositionSites = sites.filter(
    (s) => !s.isDeleted && (s.status === "submitted" || s.status === "active" || s.status === "inactive")
  );

  // Portfolio-health scope: currently operating sites only.
  const activeSites = sites.filter((s) => s.status === "active" && !s.isDeleted);

  // Parking type distribution (active sites only)
  const byParkingTypeMapActive = new Map<ParkingType, number>();
  for (const site of activeSites) {
    const type = site.parkingConfiguration.parkingType;
    byParkingTypeMapActive.set(type, (byParkingTypeMapActive.get(type) ?? 0) + 1);
  }

  // Location/area distribution (active sites only) - extract locality from address
  const byLocationMap = new Map<string, number>();
  for (const site of activeSites) {
    const area = getSiteLocality(site.address);
    byLocationMap.set(area, (byLocationMap.get(area) ?? 0) + 1);
  }

  let securityCoveredCount = 0;
  let digitallyEnabled = 0;
  let flaggedRiskCount = 0;
  const connectivityCounts = new Map<InternetQuality, number>([
    ["good", 0],
    ["poor", 0],
    ["none", 0],
  ]);

  for (const site of activeSites) {
    if (!hasMissingSecurityCoverage(site.security)) {
      securityCoveredCount += 1;
    }

    if (site.riskFactors.length > 0) flaggedRiskCount += 1;

    if (
      site.security.posDevice.includes("pos-machine") ||
      site.security.posDevice.includes("mobile-app")
    ) {
      digitallyEnabled += 1;
    }

    connectivityCounts.set(
      site.security.internetQuality,
      (connectivityCounts.get(site.security.internetQuality) ?? 0) + 1
    );
  }

  const totalCapacity = compositionSites.reduce(
    (sum, site) => sum + site.parkingConfiguration.totalSlots,
    0
  );
  const totalOperators = new Set(compositionSites.map((site) => site.operatorId)).size;
  const avgSlotsPerSite =
    compositionSites.length === 0
      ? 0
      : Math.round((totalCapacity / compositionSites.length) * 10) / 10;

  const perSiteHourlyAverages: number[] = [];
  for (const site of compositionSites) {
    const hourlyRules = site.pricing.filter((rule) => rule.billingType === "hourly");
    if (hourlyRules.length === 0) continue;
    const siteAvg = hourlyRules.reduce((sum, rule) => sum + rule.amount, 0) / hourlyRules.length;
    perSiteHourlyAverages.push(siteAvg);
  }
  const avgHourlyTicketPrice =
    perSiteHourlyAverages.length === 0
      ? 0
      : Math.round(
          perSiteHourlyAverages.reduce((sum, avg) => sum + avg, 0) / perSiteHourlyAverages.length
        );

  return {
    activeSites,
    totalSites: compositionSites.length,
    totalActive: activeSites.length,
    totalInactive: compositionSites.filter((s) => s.status === "inactive").length,
    deletedCount: sites.filter((s) => s.isDeleted).length,
    totalCapacity,
    totalOperators,
    avgSlotsPerSite,
    avgHourlyTicketPrice,
    hourlyPricedSiteCount: perSiteHourlyAverages.length,

    // Active sites composition
    byParkingTypeActive: [...byParkingTypeMapActive.entries()]
      .map(([parkingType, count]) => ({ parkingType, count }))
      .sort((a, b) => b.count - a.count),
    
    byLocationActive: [...byLocationMap.entries()]
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count),

    // Portfolio health
    securityCoveredCount,
    connectivityByTier: [...connectivityCounts.entries()].map(([tier, count]) => ({
      tier,
      label: CONNECTIVITY_TIER_LABELS[tier],
      count,
    })),
    digitalPaymentAdoptionPct:
      activeSites.length === 0 ? 0 : Math.round((digitallyEnabled / activeSites.length) * 100),
    flaggedRiskCount,
  };
}

export interface WeeklyActivationBucket {
  weekStart: string;
  count: number;
}

export function computeWeeklyActivations(sites: Site[], weeks = 8): WeeklyActivationBucket[] {
  const now = new Date();
  const currentWeekStart = startOfWeek(now);

  const buckets: WeeklyActivationBucket[] = Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - (weeks - 1 - i) * 7);
    return { weekStart: weekStart.toISOString(), count: 0 };
  });

  for (const site of sites) {
    if (!site.activatedAt) continue;
    const activatedWeekStart = startOfWeek(new Date(site.activatedAt)).getTime();
    const bucket = buckets.find((b) => new Date(b.weekStart).getTime() === activatedWeekStart);
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}
