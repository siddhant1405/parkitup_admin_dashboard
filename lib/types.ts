export type SiteStatus = "draft" | "submitted" | "active" | "inactive";

export type ParkingType = "residential" | "commercial" | "society" | "other";

// Matches the operator portal's entryExit.configuration values exactly (that app is the
// canonical source for this field — it's the one that captures it at intake).
export type EntryExitConfiguration = "same" | "separate";

export type ParkingSurface = "covered" | "uncovered" | "mixed";

export type CameraCoverage = "none" | "partial" | "full";

export type LightingLevel = "none" | "partial" | "full";

export type SignageLevel = "none" | "partial" | "full";

export type InternetQuality = "none" | "poor" | "good";

// Aligned with the operator portal's posDeviceValues (that app requires at least one
// device per site, so there's no "none" option there either).
export type PosDevice = "manual" | "pos-machine" | "mobile-app";

export type PaymentRecipientType = "individual" | "company";

// Mirrors the operator portal's entryExit shape exactly: same-gate sites must have equal
// entry/exit counts (enforced there at intake, not re-validated here since this app never
// writes it).
export interface EntryExit {
  configuration: EntryExitConfiguration;
  entryGateCount: number;
  exitGateCount: number;
}

export interface ParkingConfiguration {
  parkingType: ParkingType;
  entryExit: EntryExit;
  totalSlots: number;
  opensAt: string;
  closesAt: string;
  peakPeriods?: string;
  surface: ParkingSurface;
}

export interface SecurityConditions {
  guardroom: boolean;
  cameraCoverage: CameraCoverage;
  boomBarrier: boolean;
  anpr: boolean;
  lighting: LightingLevel;
  signage: SignageLevel;
  posDevice: PosDevice[];
  // Free-text notes captured at intake; named to match the operator portal's
  // vendorNotes/competitorNotes fields exactly (this app never writes them, only displays).
  vendorNotes?: string;
  competitorNotes?: string;
  internetQuality: InternetQuality;
  restrictions?: string;
}

export interface PeopleInfo {
  ownerName: string;
  ownerPhone: string;
  caretakerName?: string;
  caretakerPhone?: string;
  workersOnSite: number;
}

export interface PaymentRecipient {
  type: PaymentRecipientType;
  registeredName?: string;
}

export interface GstInfo {
  registered: boolean;
  gstNumber?: string;
}

export interface PricingRule {
  label: string;
  billingType: "one-time" | "hourly" | "daily" | "monthly";
  amount: number;
}

export interface Site {
  id: string;
  propertyName: string;
  address: string;
  lat: number;
  lng: number;
  photos: string[];
  status: SiteStatus;

  operatorId: string;
  operatorName: string;

  parkingConfiguration: ParkingConfiguration;
  security: SecurityConditions;
  people: PeopleInfo;
  paymentRecipient: PaymentRecipient;
  gst: GstInfo;
  pricing: PricingRule[];
  riskFactors: string[];
  rwaPassSystem?: boolean;

  isDeleted: boolean;

  createdAt: string;
  submittedAt?: string;
  // Stamped once, the first time status becomes 'active'/'inactive' respectively, and
  // never overwritten on later transitions back into that state. See
  // updateSiteStatus in lib/api.ts, the only place these are set.
  activatedAt?: string;
  inactivatedAt?: string;
  // Stamped once, the first time isDeleted becomes true. Nothing in this app currently
  // sets isDeleted (there's no delete action here), so this is populated only by seed
  // data — kept for parity with the real backend's soft-delete semantics.
  deletedAt?: string;
  updatedAt: string;
}
