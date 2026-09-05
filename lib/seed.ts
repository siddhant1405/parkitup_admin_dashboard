// Mock seed data for the exec dashboard's local Site inventory.
import type { Site } from "./types";

const OPERATORS = [
  { id: "op-1", name: "Rohan Mehta" },
  { id: "op-2", name: "Priya Nair" },
  { id: "op-3", name: "Arjun Kapoor" },
  { id: "op-4", name: "Sana Sheikh" },
];

const AREAS = [
  { name: "Rohini", address: "Sector 10, Rohini, Delhi, 110085", lat: 28.7439, lng: 77.1173 },
  { name: "Saket", address: "District Centre, Saket, Delhi, 110017", lat: 28.5245, lng: 77.2066 },
  { name: "Dwarka", address: "Sector 12, Dwarka, Delhi, 110078", lat: 28.5921, lng: 77.0460 },
  { name: "Karol Bagh", address: "Ajmal Khan Road, Karol Bagh, Delhi, 110005", lat: 28.6519, lng: 77.1909 },
  { name: "Lajpat Nagar", address: "Central Market, Lajpat Nagar, Delhi, 110024", lat: 28.5677, lng: 77.2431 },
  { name: "Connaught Place", address: "Inner Circle, Connaught Place, Delhi, 110001", lat: 28.6315, lng: 77.2167 },
  { name: "Vasant Kunj", address: "Sector D, Vasant Kunj, Delhi, 110070", lat: 28.5200, lng: 77.1591 },
  { name: "Pitampura", address: "Kohat Enclave, Pitampura, Delhi, 110034", lat: 28.7041, lng: 77.1318 },
  { name: "Janakpuri", address: "District Centre, Janakpuri, Delhi, 110058", lat: 28.6219, lng: 77.0878 },
  { name: "Vikaspuri", address: "District Centre, Vikaspuri, Delhi, 110018", lat: 28.6389, lng: 77.0583 },
];

const PLACEHOLDER_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23262626'/%3E%3C/svg%3E";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function pick<T>(arr: readonly T[], seedIndex: number): T {
  return arr[seedIndex % arr.length];
}

function buildSite(index: number): Site {
  const area = pick(AREAS, index);
  const operator = pick(OPERATORS, index);
  const parkingTypes = ["residential", "commercial", "society", "other"] as const;
  const parkingType = pick(parkingTypes, index);

  // Status distribution across the seed set: mostly active, with a spread of
  // submitted/inactive so every view has something to show. This admin dashboard's data
  // starts from 'submitted' onward — draft sites belong to the operator portal only.
  const statusCycle: Site["status"][] = [
    "active", "active", "active", "active", "active",
    "submitted", "submitted",
    "inactive",
    "submitted",
    "active", "active", "active",
    "submitted",
    "active",
  ];
  const status = pick(statusCycle, index);

  const createdAt = daysAgo(90 - index * 3);
  const submittedAt = daysAgo(80 - index * 3);
  // Stamped once, the first time a site becomes active/inactive — see the matching
  // comment on Site.activatedAt/inactivatedAt in lib/types.ts. Both can be set on the
  // same site (activatedAt persists through a later deactivation).
  const activatedAt =
    status === "active" || status === "inactive" ? daysAgo(70 - index * 2) : undefined;
  const inactivatedAt = status === "inactive" ? daysAgo(60 - index * 2) : undefined;
  const isDeleted = index === 12;
  const deletedAt = isDeleted ? daysAgo(10) : undefined;

  const hasFullSecurity = index % 3 !== 0;
  const hasRisk = index % 5 === 0;

  const posDevices: Site["security"]["posDevice"] =
    index % 4 === 0
      ? ["manual"]
      : index % 4 === 1
        ? ["manual", "pos-machine"]
        : index % 4 === 2
          ? ["pos-machine", "mobile-app"]
          : ["mobile-app"];

  // Same-gate sites must have matching entry/exit counts (mirrors the operator portal's
  // intake validation); separate-gate sites can differ.
  const sameGate = index % 2 === 0;
  const entryGateCount = (index % 3) + 1;
  const exitGateCount = sameGate ? entryGateCount : ((index + 1) % 3) + 1;

  return {
    id: `site-${index + 1}`,
    propertyName: `${area.name} Parking ${index + 1}`,
    address: area.address,
    lat: area.lat + (index % 5) * 0.001,
    lng: area.lng + (index % 5) * 0.001,
    photos: [PLACEHOLDER_PHOTO, PLACEHOLDER_PHOTO],
    status,
    operatorId: operator.id,
    operatorName: operator.name,
    parkingConfiguration: {
      parkingType,
      entryExit: {
        configuration: sameGate ? "same" : "separate",
        entryGateCount,
        exitGateCount,
      },
      totalSlots: 50 + index * 15,
      opensAt: "06:00",
      closesAt: index % 2 === 0 ? "22:00" : "23:59",
      peakPeriods: index % 2 === 0 ? "weekday evenings, weekends" : undefined,
      surface: index % 3 === 0 ? "covered" : index % 3 === 1 ? "uncovered" : "mixed",
    },
    security: {
      guardroom: hasFullSecurity,
      cameraCoverage: hasFullSecurity ? "full" : "none",
      boomBarrier: hasFullSecurity,
      anpr: index % 4 === 0,
      lighting: hasFullSecurity ? "full" : "partial",
      signage: hasFullSecurity ? "full" : "partial",
      posDevice: posDevices,
      vendorNotes: index % 2 === 0 ? "Uses Unigate for barrier hardware." : undefined,
      competitorNotes: index % 5 === 1 ? "Nearby lot run by ParkWise, similar pricing." : undefined,
      internetQuality: index % 6 === 0 ? "poor" : index % 6 === 1 ? "none" : "good",
      restrictions: index % 5 === 0 ? "Height limit 2.1m" : undefined,
    },
    people: {
      ownerName: `Owner ${index + 1}`,
      ownerPhone: "9876543210",
      caretakerName: index % 2 === 0 ? `Caretaker ${index + 1}` : undefined,
      caretakerPhone: index % 2 === 0 ? "9123456780" : undefined,
      workersOnSite: (index % 4) + 1,
    },
    paymentRecipient: {
      type: index % 3 === 0 ? "company" : "individual",
      registeredName: index % 3 === 0 ? `${area.name} Parking Pvt Ltd` : undefined,
    },
    gst: {
      registered: index % 3 === 0,
      gstNumber: index % 3 === 0 ? "07AABCU9603R1Z1" : undefined,
    },
    pricing:
      index % 3 === 0
        ? [{ label: "All days", billingType: "one-time" as const, amount: 30 + index * 5 }]
        : index % 3 === 1
          ? [{ label: "Per hour", billingType: "hourly" as const, amount: 20 + index * 2 }]
          : [
              { label: "Weekdays", billingType: "hourly" as const, amount: 20 + index * 2 },
              { label: "Weekends", billingType: "hourly" as const, amount: 30 + index * 2 },
            ],
    riskFactors: hasRisk ? ["Frequent complaints about lighting"] : [],
    rwaPassSystem: parkingType === "society" ? index % 2 === 0 : undefined,
    isDeleted,
    createdAt,
    submittedAt,
    activatedAt,
    inactivatedAt,
    deletedAt,
    updatedAt: daysAgo(Math.max(0, 5 - index)),
  };
}

export function generateSeedSites(count = 24): Site[] {
  return Array.from({ length: count }, (_, i) => buildSite(i));
}
