/**
 * Domain model for the Sandbox Request Management Portal.
 *
 * CloudLabs remains the system of record; these types describe the shape the
 * portal reads through its data providers. The catalogue's own `catalogStatus`
 * is mapped onto the PRD `lifecycle` state machine (see lib/state.ts).
 */

export type LabType =
  | "guided-lab"
  | "gps-skilling"
  | "standard-sandbox"
  | "hiad"
  | "hack-to-skill"
  | "hack-to-build";

export type Level = "Beginner" | "Intermediate" | "Advanced";

export type SolutionArea =
  | "AI Business Solutions"
  | "Cloud & AI Platforms"
  | "Security";

/** Catalogue status as it exists in the FY27 spreadsheet. */
export type CatalogStatus =
  | "Available"
  | "In Pipeline"
  | "In Pipeline (Enhancement)"
  | "Archive Now"
  | "Archive Q1 FY27";

/** PRD lifecycle state machine, drives requestability and the rules engine. */
export type Lifecycle = "Ready" | "InUse" | "InTesting" | "Stale" | "Retired";

export interface VoucherStats {
  issued: number;
  redeemed: number;
  lastRedeemed: string | null;
}

export interface Lab {
  id: string;
  title: string;
  /** interest-grabbing one-liner shown on cards and detail */
  hook: string;
  /** external lab-guide preview link (set later; null = not yet available) */
  previewUrl: string | null;
  isNew: boolean;
  type: LabType;
  typeLabel: string;
  solutionArea: SolutionArea | string;
  skillArea: string | null;
  level: Level | null;
  overview: string;
  modules: string[];
  products: string[];
  enhancements: string | null;
  catalogStatus: CatalogStatus;
  lifecycle: Lifecycle;
  requestable: boolean;
  lastRefresh: string | null;
  vouchers: VoucherStats;
  activePartners: string[];
}

/* ── Requests & fulfillment (used from Phase 2 on) ───────────────────────── */

export type RequestKind = "voucher" | "custom-sandbox";
export type VoucherPurpose = "planned-delivery" | "self-paced";

export type RequestStatus =
  | "submitted"
  | "instant-fulfilled"
  | "held"
  | "in-validation"
  | "fulfilled"
  | "blocked";

export interface PlannedDeliveryDetails {
  engagement: string;
  partner: string;
  startDate: string;
  endDate: string;
  expectedAttendees: number;
}

export interface SandboxRequest {
  id: string;
  kind: RequestKind;
  labId: string;
  labTitle: string;
  requesterName: string;
  requesterOrg: string;
  quantity: number;
  purpose: VoucherPurpose | null;
  delivery: PlannedDeliveryDetails | null;
  status: RequestStatus;
  submittedAt: string;
  slaDueAt: string | null;
  notes: string | null;
  vouchers: string[];
}
