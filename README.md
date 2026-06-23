# Microsoft Sandbox Request Portal

A premium portal for the **Microsoft Sandbox** program (powered by CloudLabs / Spektra Systems). It turns a manual, email-driven voucher process into a self-service experience, and gives customers a polished public catalog to browse.

> Status: beta / demo. Catalog and fulfillment data are seeded from the FY27 lab catalogue and served through a swappable data-provider layer, so live CloudLabs / Graph APIs can slot in later without UI changes.

## Routes

| Route | Audience | Purpose |
| --- | --- | --- |
| `/`, `/labs/[id]` | **Public / customers** | The default homepage. Read-only catalog: search, popular-tech filters, filter & group by level / workload / solution play, "what changed in Build 2026", Excel + PDF export |
| `/portal` | Partners | Partner portal landing (reached via the "Partner portal" button) |
| `/catalog`, `/catalog/[id]` | Requesters | Browse + request labs (instant vs held vs blocked rules engine) |
| `/requests` | Requesters | Request history, live SLA countdowns, voucher wallet |
| `/admin` | Sandbox team | Operations cockpit + **Lab Readiness Matrix** |

The app is split into two route groups: `(public)` (the customer-facing catalog homepage with its own chrome) and `(app)` (the partner portal with its nav). The catalog is the front door; the partner portal is one explicit click away.

## Tech

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a custom "Aurora" design system (Sora + Inter)
- **framer-motion** (motion), **zustand** (client state), **lucide-react** (icons)
- **SheetJS / xlsx** and **jsPDF + autotable** for catalog export

## Data

All 177 labs come from the FY27 catalogue (`External-PostBuild2026_GL_Catalog_FY27_v2.xlsx`), normalized into `src/data/labs.json` (with a generated "Last updated" stamp in `src/data/meta.json`) by the seed generator. The generator reads the source `.xlsx` directly (unzipping the OpenXML, no Excel/Python/Node needed) and maps each lab's catalogue status onto the lifecycle state machine the portal uses.

Run it with PowerShell: `pwsh tools/build_seed.ps1` (or `powershell -File tools/build_seed.ps1`). `tools/build_seed.py` is the original Python version, kept for reference.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy

Vercel auto-detects this as a Next.js app. No special configuration is required, just import the repo and deploy.
