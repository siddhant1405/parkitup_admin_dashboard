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
  // This function uses two different scopes deliberately, not inconsistently:
  //   - compositionSites: the whole real inventory (submitted + active + inactive,
  //     drafts and deleted excluded) — used for portfolio totals like site/operator
  //     counts and capacity, where a submitted-but-not-yet-approved site still
  //     represents real inventory worth counting.
  //   - activeSites: only sites currently live and operating — used for every
  //     "health" metric (security coverage, connectivity, risk, parking-type/location
  //     composition). A submitted or inactive site's security setup isn't relevant to
  //     "how healthy is the portfolio we're actually running today."
  // Drafts never reach this app at all (see excludeDrafts in lib/api.ts) — the
  // exclusion here is just defensive in case that invariant is ever violated upstream.
  const compositionSites = sites.filter(
    (s) => !s.isDeleted && (s.status === "submitted" || s.status === "active" || s.status === "inactive")
  );

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

    // "Digital payment adoption" counts a site as digital if it accepts card/UPI via
    // either channel — a manual/cash-only site (posDevice: ["manual"]) doesn't count,
    // even if it also happens to have a POS terminal listed for some other purpose.
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

  // "Avg. ticket price per site" is a two-level average, deliberately: first average a
  // site's own hourly pricing rules together (e.g. a site with separate weekday/weekend
  // hourly rates), then average those per-site figures across sites. This keeps a site
  // with many pricing rules from outweighing a site with only one in the portfolio-wide
  // number — a flat average over every individual rule would skew toward whichever sites
  // happen to have the most rules, not whichever sites actually charge more.
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

  // Bucketed by activatedAt regardless of current status or isDeleted — this chart is
  // "how many sites did we bring live each week," a historical fact that doesn't
  // change if the site was later deactivated or deleted. activatedAt is only ever
  // present on sites that reached 'active' at some point (see lib/api.ts), so no
  // extra status filtering is needed here.
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
