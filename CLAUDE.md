# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000 (Turbopack)
npm run build    # Production build → .next/standalone
npm run start    # Serve the production build
npm run lint     # ESLint
```

To regenerate `src/data/labs.json` from the FY27 Excel catalogue:
```powershell
pwsh tools/build_seed.ps1
```

## Architecture

### Route Groups

Two parallel user experiences, both under `src/app/`:

- **`(public)/`** — unauthenticated customer-facing catalog (`/`, `/labs/[id]`). Read-only; includes Excel/PDF export.
- **`(app)/`** — authenticated partner portal (`/portal`, `/catalog`, `/requests`, `/admin`). Layout enforces auth and redirects `mustReset` users to `/reset-password`.

### Domain Logic — keep these pure

| File | Responsibility |
|------|---------------|
| `lib/types.ts` | Canonical domain types (`Lab`, `SandboxRequest`, etc.) |
| `lib/state.ts` | Lifecycle state machine — drives requestability and UI badges |
| `lib/rules.ts` | Fulfillment rules engine — returns `FulfillmentDecision` given a lab + request. No I/O. |

**Lifecycle → fulfillment mapping:**
- `Ready` / `InUse` → instant fulfillment
- `Stale` → held, 72-hour SLA (routed to Sandbox team)
- `InTesting` / `Retired` → blocked

### Client State (Zustand)

`lib/store.ts` exposes `usePortal`, which holds requests, lifecycle overrides, and the current user. It hydrates once from the server (`hydrate()`) and optimistically updates on mutations. Don't bypass it for local UI state that should survive route changes.

### Data Persistence

`lib/data/store.ts` manages a single `PortalDoc` JSON blob:
- **Dev**: in-memory (resets on process restart)
- **Prod**: Azure Blob Storage via `AZURE_STORAGE_CONNECTION_STRING`

Server actions (`lib/data/portal-actions.ts`) are the only write path. UI calls these via Zustand actions.

### Provider Pattern

`lib/providers/` is the abstraction seam between UI and data sources. All four providers (catalog, readiness, voucher, request) are currently backed by `mock.ts` (seeded FY27 data). Swap real APIs here without touching the UI.

### Auth

JWT sessions (`lib/auth/session.ts`): HS256, 7-day max age, `httpOnly` cookie. Signing key from `SECRET_KEY` env var (auto-generated in dev). Passwords bcrypt-hashed. Roles: `"admin"` | `"requester"`.

## Environment Variables

| Variable | Required in prod | Notes |
|----------|-----------------|-------|
| `SECRET_KEY` | Yes | JWT signing key; auto-generated if absent in dev |
| `AZURE_STORAGE_CONNECTION_STRING` | Yes | Blob persistence; skipped in dev (in-memory fallback) |

### Admin Features

`/admin` is role-gated (`admin` only, enforced in `(app)/admin/layout.tsx`). Key capabilities:
- **Lifecycle overrides** — `setLifecycleAction` lets admins manually set a lab's lifecycle state (persisted in `PortalDoc.overrides`). Overrides shadow the `catalogStatus`-derived lifecycle from `lib/state.ts`.
- **User management** — `(app)/admin/users/` (CRUD on the users array in `PortalDoc`).
- **Demo reset** — `resetDemoAction` wipes all requests and overrides back to seed state.

### Catalogue Data Model

Labs carry a dual FY26/FY27 taxonomy:
- `solutionArea` / `skillArea` are the current FY27 values (aliased as `fy27Area` / `fy27Play`).
- `fy26Area` / `fy26Play` are the legacy FY26 values for crosswalk/filtering.
- `fy27Title` holds a renamed lab title when a lab was rebranded for Build 2026 (null otherwise).

### Client/Server Boundary

- `"use server"` files in `lib/data/` and `lib/auth/` are the only write path — all mutations go through server actions.
- `"use client"` pages named `*Client.tsx` (e.g. `CatalogClient.tsx`, `UsersClient.tsx`) receive hydrated data as props and call server actions via the Zustand store.
- Never import server-only modules from Client Components; use the `server-only` package marker to enforce this.

## Key Conventions

- **`server-only`** imports mark files that must never reach the client bundle. Don't remove them.
- Path alias `@/*` maps to `src/*`.
- Tailwind v4 — use CSS variable-based theming; avoid hardcoded hex values.
- Seed data lives in `src/data/labs.json` (177 FY27 labs). Do not hand-edit; regenerate via `build_seed.ps1`.
