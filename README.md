# ParkItUp Admin Dashboard

Executive (CEO/stakeholder) dashboard for `output.parkitup.com` — a read-mostly
view of every parking site logged through the separate operator portal, plus
the manager's approval workflow for confirming sites as active.

Standalone Next.js repo, no monorepo, mirroring the conventions used in the
operator portal and `attendant-manager`.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- shadcn/ui (new-york style)
- TanStack Query for server state (reads + the one write action)
- `lib/api.ts` — mock data layer backed by `localStorage`, key
  `parkitup_admin_sites`, seeded on first load. Shares the `Site` shape with
  the operator portal so a real backend can unify both later.
- `proxy.ts` (not `middleware.ts` — Next.js 16 convention) as a placeholder
  auth-gate route guard

No Zustand — TanStack Query + local `useState` covers everything this app
needs.

## Getting started

```bash
npm install
npm run dev
```

Visiting any route redirects to `/login` until you click "Continue as Admin",
which sets a placeholder session cookie (`parkitup_admin_session`). There's no
real credential check yet.

## Project structure

- `app/login` — public login page
- `app/(dashboard)` — everything behind the auth gate, wrapped in the sidebar
  shell (`components/app-shell.tsx`):
  - `/` — Overview: portfolio KPIs, composition charts, portfolio health,
    weekly activations, and the sites map
  - `/pending` — Pending Approval: submitted sites awaiting manager review,
    approve/reject via `updateSiteStatus`
  - `/sites` — full site list with status/parking-type filters, sort, and
    locality grouping
  - `/sites/[id]` — single site detail
  - `/inactive` — Inactive / Deleted: deactivated and deleted sites
  - `/map` — fullscreen map with marker clustering (`@googlemaps/markerclusterer`)
    and a "needs attention" filter (flagged risk / missing security coverage)
- `lib/types.ts` — the `Site` data model
- `lib/seed.ts` — mock seed data generator (Delhi-only addresses, no `draft`
  sites)
- `lib/api.ts` — mock read/write layer (localStorage-backed)
- `lib/queries.ts` — TanStack Query hooks and shared cache keys
- `lib/kpi.ts` — overview KPI and weekly-activation computations
- `components/kpi/` — KPI stat tiles, charts, and breakdown cards
- `components/map/` — map rendering, marker styling, and legend

## Status model

Sites move through `draft → submitted → active → inactive` (and `active` can
return to `inactive` → `active`). `draft` sites belong to the operator portal
and are never surfaced in this admin dashboard. Managers move a `submitted`
site to `active` (or reject it back) from the Pending Approval queue via the
single write action, `updateSiteStatus`.

`activatedAt` is stamped once, the first time a site becomes `active`, and is
never overwritten on later reactivation.

## Sidebar navigation

Overview, Pending Approval (with a badge for the pending count), Sites, and
Inactive / Deleted — see `lib/nav.ts`.

## KPIs

The Overview page (`lib/kpi.ts`) reports:

- Portfolio row: total/active/inactive/deleted site counts, total capacity,
  total operators, average hourly ticket price, and average slots per site
  — scoped to submitted + active + inactive sites (drafts and deleted
  excluded)
- Composition: sites by parking type and by locality — active sites only
- Portfolio health: security coverage, connectivity by tier, digital payment
  adoption, and flagged risks — active sites only
- Site activations over time (weekly buckets, from `activatedAt`)
