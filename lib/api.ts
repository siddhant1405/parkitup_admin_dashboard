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
const SEED_VERSION = 4;
// Artificial delay so loading states (skeletons, disabled buttons) are actually
// exercised during development instead of resolving instantly. A real fetch() to a
// real backend won't need this — delay() can just be dropped once fetchSites /
// fetchSiteById / updateSiteStatus call real endpoints instead.
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

// The only transitions a manager can make from this app: approve a submission
// (submitted -> active), or toggle a live site off/back on (active <-> inactive).
// 'draft' has no outgoing transitions here since drafts never reach this app at all
// (see excludeDrafts above) — there's nothing for a manager to do with one.
const VALID_TRANSITIONS: Record<SiteStatus, SiteStatus[]> = {
  draft: [],
  submitted: ["active"],
  active: ["inactive"],
  inactive: ["active"],
};

// This app's only write action — everything else (fetchSites, fetchSiteById) is
// read-only. There is no create/edit-site function here by design: sites are
// authored entirely in the operator portal, and this app only approves/rejects and
// toggles their live status.
export async function updateSiteStatus(id: string, nextStatus: SiteStatus): Promise<SiteType> {
  const sites = readAll();
  const index = sites.findIndex((site) => site.id === id);
  if (index === -1) throw new Error(`Site ${id} not found`);

  const site = sites[index];
  if (!VALID_TRANSITIONS[site.status].includes(nextStatus)) {
    throw new Error(`Cannot transition site ${id} from ${site.status} to ${nextStatus}`);
  }

  const now = new Date().toISOString();
  // activatedAt/inactivatedAt are stamped only the first time a site reaches that
  // state, and never overwritten on a later transition back into it (so activatedAt
  // still reflects the site's original activation date even after several
  // active <-> inactive cycles).
  const updated: SiteType = {
    ...site,
    status: nextStatus,
    activatedAt: nextStatus === "active" && !site.activatedAt ? now : site.activatedAt,
    inactivatedAt: nextStatus === "inactive" && !site.inactivatedAt ? now : site.inactivatedAt,
    updatedAt: now,
  };
  sites[index] = updated;
  writeAll(sites);
  return delay(updated);
}
