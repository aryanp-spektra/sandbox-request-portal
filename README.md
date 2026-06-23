# Microsoft Sandbox Request Portal

A premium portal for the **Microsoft Sandbox** program (powered by CloudLabs / Spektra Systems). It turns a manual, email-driven voucher process into a self-service experience, and gives customers a polished public catalog to browse.

> Status: beta / demo. Catalog and fulfillment data are seeded from the FY27 lab catalogue and served through a swappable data-provider layer, so live CloudLabs / Graph APIs can slot in later without UI changes.

## Routes

| Route | Audience | Purpose |
| --- | --- | --- |
| `/` | Partners | Landing page |
| `/catalog`, `/catalog/[id]` | Requesters | Browse + request labs (instant vs held vs blocked rules engine) |
| `/requests` | Requesters | Request history, live SLA countdowns, voucher wallet |
| `/admin` | Sandbox team | Operations cockpit + **Lab Readiness Matrix** |
| `/explore`, `/explore/[id]` | **Public / customers** | Read-only catalog: search, filter & group by level / workload / solution play, "what changed in Build 2026", Excel + PDF export |

The app is split into two route groups: `(app)` (role-gated, with the partner nav) and `(public)` (the customer-facing catalog with its own chrome).

## Tech

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a custom "Aurora" design system (Sora + Inter)
- **framer-motion** (motion), **zustand** (client state), **lucide-react** (icons)
- **SheetJS / xlsx** and **jsPDF + autotable** for catalog export

## Data

All 178 labs come from the FY27 catalogue, normalized into `src/data/labs.json` (with a generated "Last updated" stamp in `src/data/meta.json`) by `tools/build_seed.py`. The script reads the source `.xlsx` (kept outside this repo) and maps each lab's catalogue status onto the lifecycle state machine the portal uses.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy

Vercel auto-detects this as a Next.js app. No special configuration is required, just import the repo and deploy.
