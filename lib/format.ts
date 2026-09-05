import type {
  CameraCoverage,
  EntryExitConfig,
  InternetQuality,
  LightingLevel,
  ParkingSurface,
  ParkingType,
  PaymentRecipientType,
  PosDevice,
  SignageLevel,
  SiteStatus,
} from "./types";

export const STATUS_LABELS: Record<SiteStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  active: "Active",
  inactive: "Inactive",
};

export const PARKING_TYPE_LABELS: Record<ParkingType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  society: "Society",
  other: "Other",
};

const ENTRY_EXIT_LABELS: Record<EntryExitConfig, string> = {
  "same-gate": "Same gate",
  "separate-gates": "Separate gates",
};

const SURFACE_LABELS: Record<ParkingSurface, string> = {
  covered: "Covered",
  uncovered: "Uncovered",
  mixed: "Mixed",
};

const LEVEL_LABELS: Record<CameraCoverage | LightingLevel | SignageLevel, string> = {
  none: "None",
  partial: "Partial",
  full: "Full",
};

const INTERNET_LABELS: Record<InternetQuality, string> = {
  none: "None",
  poor: "Poor",
  good: "Good",
};

const POS_DEVICE_LABELS: Record<PosDevice, string> = {
  cash: "Cash",
  "pos-machine": "POS machine",
  "mobile-app": "Mobile app",
};

const PAYMENT_RECIPIENT_LABELS: Record<PaymentRecipientType, string> = {
  individual: "Individual",
  company: "Company",
};

export function formatEntryExit(config: EntryExitConfig): string {
  return ENTRY_EXIT_LABELS[config];
}

export function formatSurface(surface: ParkingSurface): string {
  return SURFACE_LABELS[surface];
}

export function formatLevel(level: CameraCoverage | LightingLevel | SignageLevel): string {
  return LEVEL_LABELS[level];
}

export function formatInternetQuality(quality: InternetQuality): string {
  return INTERNET_LABELS[quality];
}

export function formatPosDevices(devices: PosDevice[]): string {
  if (devices.length === 0) return "—";
  return devices.map((device) => POS_DEVICE_LABELS[device]).join(", ");
}

export function formatPaymentRecipientType(type: PaymentRecipientType): string {
  return PAYMENT_RECIPIENT_LABELS[type];
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Address format is "<street/sector>, <locality>, Delhi, <pincode>" — the locality
// (second segment) is the meaningful grouping, not the street-level first segment.
export function getSiteLocality(address: string): string {
  const addressParts = address.split(",");
  return (addressParts[1] ?? addressParts[0]).trim() || "Unknown";
}

export function hasMissingSecurityCoverage(security: {
  guardroom: boolean;
  cameraCoverage: CameraCoverage;
  boomBarrier: boolean;
  lighting: LightingLevel;
}): boolean {
  return (
    !security.guardroom ||
    security.cameraCoverage === "none" ||
    !security.boomBarrier ||
    security.lighting === "none"
  );
}
