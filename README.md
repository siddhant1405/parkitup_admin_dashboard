# ParkItUp Admin Dashboard

Executive (CEO/manager) dashboard for `output.parkitup.com`.

## What this is

This is one half of a two-portal system:

- **The operator portal** (`parkitup_operator_dashboard`) is where field operators log
  and edit parking sites — the full intake form, photos, pricing, security conditions,
  everything. It's the app that *creates* the `Site` record.
- **This app** is where a manager reviews what's been submitted and decides what goes
  live. It reads the exact same `Site` data the operator portal writes — there is no
  separate admin-only dataset — and adds the one thing the operator portal doesn't do:
  the approval workflow (`submitted → active`) plus the ability to take a live site
  offline and back on (`active ↔ inactive`).

Concretely, this app is **read-only except for one write action**,
`updateSiteStatus` in `lib/api.ts`. Nothing here creates or edits a site's actual
content (address, pricing, security conditions, etc.) — that only ever happens in the
operator portal. See `API_CONTRACT.md` for the full data contract this app expects the
real backend to serve, including exactly which status transitions are valid and when
each lifecycle timestamp gets stamped.

There's currently no real backend — see "Mock data and mock APIs" below.

## Tech stack

- **Next.js 16 (App Router) + TypeScript** — matches the operator portal's stack, so
  patterns (routing, data fetching, forms) transfer directly between the two codebases.
- **Tailwind CSS v4** — utility-first styling, no separate CSS files per component.
- **shadcn/ui (new-york style)** — accessible Radix-based primitives
  (`components/ui/`), themed to this app's flat monochrome design system rather than
  shadcn's defaults.
- **TanStack Query** — server-state caching and mutations (`lib/queries.ts`). Even
  though today's "server" is `localStorage`, structuring data access through
  TanStack Query from day one means swapping `lib/api.ts` for real `fetch()` calls
  won't require touching any component — they already go through `useSites`/`useSite`/
  `useUpdateSiteStatus` hooks, not `lib/api.ts` directly.
- **react-hook-form + zod** — the login form's validation, matching the pattern used
  for forms in the operator portal.
- **`@vis.gl/react-google-maps` + `@googlemaps/markerclusterer`** — the site map and
  marker clustering on `/map` and the Overview page.
- **recharts** — the parking-type composition chart.
- No Zustand, no Redux — TanStack Query plus local `useState` covers everything this
  app currently needs; there's no client state complex enough to warrant more.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in a real Google Maps API key
npm run dev
```

Open `http://localhost:3000`. Any route redirects to `/login` until you sign in — see
"Mock data and mock APIs" below for exactly what that does and doesn't check.

Other scripts:

```bash
npm run build   # production build
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

## Mock data and mock APIs

**Nothing in this app talks to a network today.** `lib/api.ts` is a mock data layer
that reads/writes a JSON blob under the `parkitup_admin_sites` localStorage key,
seeded on first load from `lib/seed.ts` (24 sites, Delhi-only addresses, realistic
variety across every field). `SIMULATED_LATENCY_MS` (250ms) fakes network latency so
loading skeletons and disabled-button states are actually exercised during
development.

Auth is equally mocked: `proxy.ts` (Next.js 16's `middleware.ts` equivalent) only
checks that a `parkitup_admin_session` cookie is *present* — never its value, and the
login form never checks the submitted email/phone + password against anything real.
Any validly-formatted input succeeds. See the code comments in `proxy.ts` and
`lib/auth.ts` for exactly where the real check needs to go.

**`API_CONTRACT.md`** at the repo root documents everything a backend developer needs
to build the real API: the full `Site` type (matching the operator portal's shape),
every function `lib/api.ts` currently exposes and what the real endpoint behind each
one needs to do, the valid status transitions and timestamp-stamping rules, and a
fully-populated sample `Site` JSON object. Read that before touching `lib/api.ts`.

## Where to continue

**Done:**
- The full UI: Overview KPIs, Pending Approval queue, Sites list (filter/sort/locality
  grouping), Inactive/Deleted, site detail, and the map.
- The approval workflow's business logic (valid transitions, timestamp stamping) —
  this is real logic, just currently backed by localStorage instead of a real database.
- The `Site` type, aligned field-for-field with the operator portal's canonical shape
  (see `API_CONTRACT.md` for where they still differ and why).

**Not done — this is the actual work of turning this into a real product:**
- **Real auth.** Right now, anyone who types a validly-formatted email/phone and a
  6+ character password gets in. There's no account system, no password check, no
  session expiry logic beyond a flat 7-day cookie.
- **A real backend.** `lib/api.ts` needs to become real `fetch()` calls per
  `API_CONTRACT.md`. Nothing else in the app should need to change if that contract is
  followed — every component consumes `lib/queries.ts`'s hooks, not `lib/api.ts`
  directly.
- **Deployment.** No CI/CD, no hosting configuration exists yet.

**Recommended path for a backend developer joining this project:**
1. Branch off `main`.
2. Read `API_CONTRACT.md` in full — it's written for exactly this.
3. Implement the contract against whatever the operator portal's backend turns out to
   be (or is already becoming) — remember, this is *one* shared API, not two.
4. Replace `lib/api.ts`'s internals with real `fetch()` calls, keeping its exported
   function signatures (`fetchSites`, `fetchSiteById`, `updateSiteStatus`) the same so
   nothing else in the app needs to change.
5. Replace `proxy.ts`'s cookie-presence check and the login page's placeholder
   `setSessionCookie()` call with real session verification.
6. PR back to `main`.

## Folder structure

```
app/
  login/page.tsx           — public login page
  (dashboard)/             — everything behind the auth gate
    layout.tsx              — sidebar shell wrapper
    page.tsx                 — Overview ("/")
    pending/page.tsx         — Pending Approval ("/pending")
    sites/page.tsx           — Sites list ("/sites")
    sites/[id]/page.tsx      — Site detail ("/sites/[id]")
    inactive/page.tsx        — Inactive / Deleted ("/inactive")
    map/page.tsx             — Fullscreen map ("/map")
  icon.svg                  — favicon (Next.js auto-detected)
lib/
  types.ts                  — the Site data model
  seed.ts                    — mock seed data generator
  api.ts                      — mock read/write layer (localStorage-backed)
  auth.ts                     — placeholder session-cookie helper
  queries.ts                  — TanStack Query hooks and cache keys
  kpi.ts                       — Overview KPI and weekly-activation computations
  format.ts                    — label maps and display formatters
  map-colors.ts                 — shared color tokens for map markers/legend
  nav.ts                         — sidebar nav item definitions
components/
  kpi/                        — KPI stat tiles, charts, and breakdown cards
  map/                         — map rendering, marker styling, legend
  ui/                          — shadcn/ui primitives
  sidebar-nav.tsx, app-shell.tsx, status-badge.tsx, ...  — app-level components
public/
  logo.svg                    — header logo
API_CONTRACT.md              — backend contract (read this before building a real API)
```

KPI and chart logic lives entirely under `lib/kpi.ts` + `components/kpi/` — nothing
KPI-related is scattered loose under `app/`.

## Status model

```
draft ──▶ submitted ──▶ active ──▶ inactive ──▶ active ...
```

- `draft` sites belong to the operator portal only and are **never surfaced in this
  app** — `lib/api.ts` filters them out unconditionally (`excludeDrafts`), regardless
  of how they might end up in storage.
- `submitted` sites appear in the Pending Approval queue.
- A manager approves (`submitted → active`) or deactivates/reactivates
  (`active ↔ inactive`) via `updateSiteStatus` — this app's only write action.

`activatedAt` and `inactivatedAt` are each stamped once, the first time a site enters
that state, and never overwritten by a later re-entry into the same state — see
`lib/api.ts` and `API_CONTRACT.md` for the exact rule and why it matters (several KPIs
and the activations-over-time chart depend on it).

## Sidebar navigation

Overview, Pending Approval (with a badge showing the pending count), Sites, and
Inactive / Deleted — see `lib/nav.ts`.

## KPI scoping rules

This is the one place in the app where the business logic is more subtle than a
typical CRUD dashboard, so it's worth calling out explicitly (see the comments at the
top of `computeOverviewKpis` in `lib/kpi.ts` for the authoritative version):

- **Drafts are always excluded**, everywhere, unconditionally — they're not this app's
  concern at all.
- **Deleted sites are always excluded** from every KPI, even though they're still
  visible in the Inactive / Deleted list.
- Beyond that, there are two different scopes in play, deliberately:
  - **Portfolio totals** (total sites, total capacity, total operators, average
    ticket price, average slots per site) use `submitted + active + inactive` sites —
    the whole real inventory, pipeline included. A submitted-but-not-yet-approved site
    still represents real inventory worth counting toward "how big is our portfolio."
  - **Every "health" metric** (security coverage, connectivity by tier, digital
    payment adoption, flagged risks, and the parking-type/location composition charts)
    is scoped to **active sites only**. A submitted or inactive site's security setup
    isn't relevant to "how healthy is the portfolio we're actually running today."
- "Avg. ticket price per site" is a **two-level average**: first average each site's
  own hourly pricing rules together, then average those per-site figures across sites.
  This keeps a site with many pricing rules (e.g. separate weekday/weekend rates) from
  outweighing a site with only one in the portfolio-wide figure.
