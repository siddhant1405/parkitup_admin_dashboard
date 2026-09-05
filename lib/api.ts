// Mock data layer. Reads/writes a local JSON blob under its own localStorage
// key, seeded on first access. A real backend can replace this module
// without touching callers, since it mirrors the shape callers expect.
import { generateSeedSites } from "./seed";
import type { Site as SiteType, SiteStatus } from "./types";

const STORAGE_KEY = "parkitup_admin_sites";
// Bump whenever generateSeedSites()'s shape or values change in a way that matters to
// existing browsers (new fields, corrected data, etc). Without this, a browser that
// seeded before the change keeps serving the stale cached data forever, since seeding
// only happens when the key is absent.
const SEED_VERSION = 3;
const SIMULATED_LATENCY_MS = 250;

interface StoredData {
  version: number;
  sites: SiteType[];
}

function reseed(): SiteType[] {
  const seeded = generateSeedSites();
  const stored: StoredData = { version: SEED_VERSION, sites: seeded };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return seeded;
}

// Draft sites belong to the operator portal, not this admin dashboard — never surface
// them here, no matter how they ended up in storage.
function excludeDrafts(sites: SiteType[]): SiteType[] {
  return sites.filter((site) => site.status !== "draft");
}

function readAll(): SiteType[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return excludeDrafts(reseed());
  try {
    const parsed = JSON.parse(raw) as StoredData;
    if (parsed.version !== SEED_VERSION || !Array.isArray(parsed.sites)) return excludeDrafts(reseed());
    return excludeDrafts(parsed.sites);
  } catch {
    return excludeDrafts(reseed());
  }
}

function writeAll(sites: SiteType[]) {
  const stored: StoredData = { version: SEED_VERSION, sites };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

export async function fetchSites(): Promise<SiteType[]> {
  return delay(readAll());
}

export async function fetchSiteById(id: string): Promise<SiteType | undefined> {
  return delay(readAll().find((site) => site.id === id));
}

const VALID_TRANSITIONS: Record<SiteStatus, SiteStatus[]> = {
  draft: [],
  submitted: ["active"],
  active: ["inactive"],
  inactive: ["active"],
};

export async function updateSiteStatus(id: string, nextStatus: SiteStatus): Promise<SiteType> {
  const sites = readAll();
  const index = sites.findIndex((site) => site.id === id);
  if (index === -1) throw new Error(`Site ${id} not found`);

  const site = sites[index];
  if (!VALID_TRANSITIONS[site.status].includes(nextStatus)) {
    throw new Error(`Cannot transition site ${id} from ${site.status} to ${nextStatus}`);
  }

  const now = new Date().toISOString();
  const updated: SiteType = {
    ...site,
    status: nextStatus,
    activatedAt: nextStatus === "active" && !site.activatedAt ? now : site.activatedAt,
    updatedAt: now,
  };
  sites[index] = updated;
  writeAll(sites);
  return delay(updated);
}
