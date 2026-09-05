export type SiteStatus = "draft" | "submitted" | "active" | "inactive";

export type ParkingType = "residential" | "commercial" | "society" | "other";

export type EntryExitConfig = "same-gate" | "separate-gates";

export type ParkingSurface = "covered" | "uncovered" | "mixed";

export type CameraCoverage = "none" | "partial" | "full";

export type LightingLevel = "none" | "partial" | "full";

export type SignageLevel = "none" | "partial" | "full";

export type InternetQuality = "none" | "poor" | "good";

export type PosDevice = "cash" | "pos-machine" | "mobile-app";

export type PaymentRecipientType = "individual" | "company";

export interface ParkingConfiguration {
  parkingType: ParkingType;
  entryExitConfig: EntryExitConfig;
  numberOfGates: number;
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
  vendorPricingNotes?: string;
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
  activatedAt?: string;
  updatedAt: string;
}
