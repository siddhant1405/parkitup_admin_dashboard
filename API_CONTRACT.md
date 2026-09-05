# API Contract — ParkItUp Admin Dashboard

This document is for whoever builds the real backend. It describes the data shape and
endpoints this frontend currently gets from a mock, localStorage-backed layer
(`lib/api.ts`), so that layer can be swapped for real HTTP calls without changing any
component that consumes it.

**This app is one of two frontends over a single shared backend.** The operator portal
(`parkitup_operator_dashboard`) is where sites are created and edited; this admin
dashboard only reads that same data and adds one thing on top of it — the manager
approval workflow (`submitted → active`) and the ability to toggle a live site
`active ↔ inactive`. There is no separate "admin database" — both apps are expected to
read and write the same `sites` table/collection through the same API.

If this document and the operator portal's contract ever disagree on the `Site` shape,
**the operator portal's contract is canonical** — it's the app that actually authors
sites, so its shape is the source of truth. This document exists because, as of this
pass, the operator portal doesn't have its own `API_CONTRACT.md` yet; the shape below
was aligned by hand against its actual `Site` schema
(`features/sites/schemas/site.ts`) for the fields that matter to this app. A few fields
below (`inactivatedAt`, `deletedAt`) exist only in this document because the operator
portal never sets or reads them — they're generated/consumed exclusively by the admin
dashboard's approval workflow.

## Status model

```
draft ──(operator submits)──▶ submitted ──(manager approves)──▶ active ──▶ inactive ──▶ active ...
```

- `draft` — being edited by an operator in the operator portal. **Never surfaced in this
  app** — see "Endpoints" below.
- `submitted` — operator has submitted the site for review. Appears in this app's
  Pending Approval queue.
- `active` — approved and live. Counts toward every KPI on the Overview page.
- `inactive` — was active, has since been taken offline (by a manager, from this app).
  Can be reactivated.

A site can cycle `active ↔ inactive` any number of times. It cannot go back to `draft`
or `submitted` once submitted — those are one-way. There is no "reject back to draft"
transition modeled currently; rejecting a submission is a product decision the backend
should clarify (this app's mock only supports `submitted → active`).

### Timestamp stamping rules

Four lifecycle timestamps exist alongside `status`, and each is a **write-once** field
from this app's perspective: set the first time the site enters that state, and never
overwritten by a later re-entry into the same state.

| Field           | Set when...                                  | Never overwritten by...                    |
|-----------------|-----------------------------------------------|---------------------------------------------|
| `createdAt`     | site record first created (operator portal)  | —                                           |
| `submittedAt`   | operator submits (`draft → submitted`)        | a later resubmission (not currently modeled)|
| `activatedAt`   | **first** time status becomes `active`       | later `inactive → active` transitions       |
| `inactivatedAt` | **first** time status becomes `inactive`      | later `active → inactive` transitions       |
| `deletedAt`     | **first** time `isDeleted` becomes `true`     | n/a — deletion isn't currently reversible from this app |
| `updatedAt`     | any mutation                                  | always updated — this one is *not* write-once |

The reason `activatedAt`/`inactivatedAt` matter: the Overview page's "Site activations
over time" chart and various trend indicators are keyed off these fields. If the real
backend updates them on every transition instead of only the first, those figures will
silently misrepresent history (e.g. a site's activation date would jump forward every
time it's reactivated).

## The `Site` type

```ts
type SiteStatus = "draft" | "submitted" | "active" | "inactive";

type ParkingType = "residential" | "commercial" | "society" | "other";
type EntryExitConfiguration = "same" | "separate";
type ParkingSurface = "covered" | "uncovered" | "mixed";
type CameraCoverage = "none" | "partial" | "full";
type LightingLevel = "none" | "partial" | "full";
type SignageLevel = "none" | "partial" | "full";
type InternetQuality = "none" | "poor" | "good";
type PosDevice = "manual" | "pos-machine" | "mobile-app";
type PaymentRecipientType = "individual" | "company";

interface EntryExit {
  configuration: EntryExitConfiguration;
  entryGateCount: number;
  exitGateCount: number;
  // Business rule (enforced at intake in the operator portal, not re-validated here):
  // if configuration is "same", entryGateCount must equal exitGateCount.
}

interface ParkingConfiguration {
  parkingType: ParkingType;
  entryExit: EntryExit;
  totalSlots: number;
  opensAt: string;         // "HH:MM", 24-hour, e.g. "06:00"
  closesAt: string;        // "HH:MM", 24-hour, e.g. "23:59"
  peakPeriods?: string;    // free text, e.g. "weekday evenings, weekends"
  surface: ParkingSurface;
}

interface SecurityConditions {
  guardroom: boolean;
  cameraCoverage: CameraCoverage;
  boomBarrier: boolean;
  anpr: boolean;
  lighting: LightingLevel;
  signage: SignageLevel;
  posDevice: PosDevice[];      // multi-select, at least one entry
  vendorNotes?: string;        // free text
  competitorNotes?: string;    // free text
  internetQuality: InternetQuality;
  restrictions?: string;       // free text, e.g. "Height limit 2.1m"
}

interface PeopleInfo {
  ownerName: string;
  ownerPhone: string;          // exactly 10 digits
  caretakerName?: string;
  caretakerPhone?: string;     // exactly 10 digits, when present
  workersOnSite: number;
}

interface PaymentRecipient {
  type: PaymentRecipientType;
  registeredName?: string;     // present when type === "company", typically
}

interface GstInfo {
  registered: boolean;
  gstNumber?: string;          // present when registered === true, typically
}

interface PricingRule {
  label: string;                // e.g. "Weekdays", "All days"
  billingType: "one-time" | "hourly" | "daily" | "monthly";
  amount: number;                // in rupees
}

interface Site {
  id: string;
  propertyName: string;
  address: string;
  lat: number;
  lng: number;
  photos: string[];              // URLs (or data URIs in the mock)
  status: SiteStatus;

  operatorId: string;
  operatorName: string;          // denormalized for display; source of truth is the Operator record

  parkingConfiguration: ParkingConfiguration;
  security: SecurityConditions;
  people: PeopleInfo;
  paymentRecipient: PaymentRecipient;
  gst: GstInfo;
  pricing: PricingRule[];
  riskFactors: string[];
  rwaPassSystem?: boolean;       // only meaningful when parkingConfiguration.parkingType === "society"

  isDeleted: boolean;            // soft delete — never hard-deleted

  createdAt: string;             // ISO 8601
  submittedAt?: string;          // ISO 8601
  activatedAt?: string;          // ISO 8601, write-once — see table above
  inactivatedAt?: string;        // ISO 8601, write-once — see table above
  deletedAt?: string;            // ISO 8601, write-once — see table above
  updatedAt: string;             // ISO 8601, updated on every mutation
}
```

### The `Operator` type

Neither frontend currently defines a formal `Operator` entity in code — the admin
dashboard only ever sees `operatorId`/`operatorName` denormalized onto each `Site`, and
the operator portal's own login takes a bare email/phone string as identity with no
backing user record. The real backend will need an actual `Operator`/`User` table; a
minimal shape that satisfies both frontends as they exist today is:

```ts
interface Operator {
  id: string;
  name: string;
  email?: string;
  phone?: string;     // exactly 10 digits, when present
  createdAt: string;   // ISO 8601
}
```

Treat this as a starting point, not a spec — the real login/account system (neither
frontend has one yet; see README.md's "Where to continue") will likely need more here
(password hash, role, etc.), and that design is the backend developer's to make.

## `lib/api.ts` — every function, and what the real backend needs to replicate

This app is **read-only except for `updateSiteStatus`**. There is no create-site or
edit-site function here, and none should be added — sites are authored entirely in the
operator portal; this app only approves/rejects submissions and toggles a live site's
status.

### `fetchSites(): Promise<Site[]>`
Returns every site **except those with `status === "draft"`**. This exclusion is
load-bearing, not incidental — drafts are an operator-portal-only concept (a site being
actively edited, not yet ready for anyone else to see), and this app is built on the
assumption it will never encounter one. The real endpoint backing this
(`GET /api/sites` or similar) should either filter server-side, or this app's query
layer should keep filtering client-side — but the filter must exist somewhere.

### `fetchSiteById(id: string): Promise<Site | undefined>`
Returns a single site by id, or `undefined`/404 if not found (including if it exists
but is a `draft` — same exclusion as above applies).

### `updateSiteStatus(id: string, nextStatus: SiteStatus): Promise<Site>`
This app's **only write action**. Valid transitions:

| From        | To        | Trigger                                    |
|-------------|-----------|---------------------------------------------|
| `submitted` | `active`  | Manager approves from the Pending Approval queue |
| `active`    | `inactive`| Manager deactivates a live site              |
| `inactive`  | `active`  | Manager reactivates a previously-deactivated site |

Any other transition (e.g. `draft → active`, `active → submitted`) should be rejected
by the real backend with a 4xx, the same way the mock throws on an invalid transition.

On a successful transition to `active`, stamp `activatedAt` **only if it isn't already
set**. On a successful transition to `inactive`, stamp `inactivatedAt` **only if it
isn't already set**. Always update `updatedAt` regardless of whether this is a first
transition or a repeat cycle. See the "Timestamp stamping rules" table above.

There is no operators-list endpoint used by this app currently — operator identity
arrives denormalized on each `Site` (`operatorId`/`operatorName`), so a dedicated
`GET /api/operators` isn't required for this app's current feature set, though the
backend will presumably need one for the operator portal's own account system.

## Sample `Site` JSON

`rwaPassSystem` is omitted below since this site's `parkingType` is `"residential"`,
not `"society"` — it should only be present (`true`/`false`) on society sites, and
absent (not `null`) otherwise. `inactivatedAt` and `deletedAt` are shown as `null`
since this site has never been deactivated or deleted.

```json
{
  "id": "site-1",
  "propertyName": "Rohini Parking 1",
  "address": "Sector 10, Rohini, Delhi, 110085",
  "lat": 28.7439,
  "lng": 77.1173,
  "photos": ["https://cdn.example.com/sites/site-1/photo-1.jpg"],
  "status": "active",

  "operatorId": "op-1",
  "operatorName": "Rohan Mehta",

  "parkingConfiguration": {
    "parkingType": "residential",
    "entryExit": {
      "configuration": "same",
      "entryGateCount": 2,
      "exitGateCount": 2
    },
    "totalSlots": 65,
    "opensAt": "06:00",
    "closesAt": "22:00",
    "peakPeriods": "weekday evenings, weekends",
    "surface": "covered"
  },

  "security": {
    "guardroom": true,
    "cameraCoverage": "full",
    "boomBarrier": true,
    "anpr": true,
    "lighting": "full",
    "signage": "full",
    "posDevice": ["manual", "pos-machine"],
    "vendorNotes": "Uses Unigate for barrier hardware.",
    "internetQuality": "good",
    "restrictions": "Height limit 2.1m"
  },

  "people": {
    "ownerName": "Owner 1",
    "ownerPhone": "9876543210",
    "caretakerName": "Caretaker 1",
    "caretakerPhone": "9123456780",
    "workersOnSite": 2
  },

  "paymentRecipient": {
    "type": "company",
    "registeredName": "Rohini Parking Pvt Ltd"
  },

  "gst": {
    "registered": true,
    "gstNumber": "07AABCU9603R1Z1"
  },

  "pricing": [
    { "label": "All days", "billingType": "one-time", "amount": 30 }
  ],

  "riskFactors": ["Frequent complaints about lighting"],

  "isDeleted": false,

  "createdAt": "2025-06-08T09:12:00.000Z",
  "submittedAt": "2025-06-18T09:12:00.000Z",
  "activatedAt": "2025-06-28T09:12:00.000Z",
  "inactivatedAt": null,
  "deletedAt": null,
  "updatedAt": "2025-08-31T09:12:00.000Z"
}
```

## Backend framework notes

- **camelCase is required.** Both frontends consume `camelCase` JSON as shown above —
  `propertyName`, `operatorId`, `activatedAt`, etc. If the backend is Django REST
  Framework (which defaults to `snake_case`), use
  [`djangorestframework-camel-case`](https://github.com/vbabiy/djangorestframework-camel-case)
  so the wire format matches this contract without either frontend needing
  transformation logic.
- **CORS.** Both frontends are separate Next.js apps on separate origins/ports, both
  calling the same backend. The backend needs CORS configured to allow both origins
  (and credentialed requests, if auth ends up cookie-based rather than token-based).

## What's mocked here, concretely

- `lib/api.ts` reads/writes a JSON blob under the `parkitup_admin_sites` localStorage
  key, seeded on first load from `lib/seed.ts`. There is no network call anywhere in
  this app today.
- `SIMULATED_LATENCY_MS` (250ms) in `lib/api.ts` fakes network latency so loading
  states are exercised in development. Drop it once real `fetch()` calls exist.
- Auth (`proxy.ts` + `lib/auth.ts` + the login page) checks only for the *presence* of
  a `parkitup_admin_session` cookie, never its value, and never checks the submitted
  email/phone + password against anything — any validly-formatted input succeeds. See
  README.md's "Where to continue" section for the replacement path.
