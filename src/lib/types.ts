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

/** Catalogue status as it exists in the FY27 v2 spreadsheet. */
export type CatalogStatus =
  | "Available"
  | "Available (Outdated content)"
  | "Available on Demand (Funding Required)"
  | "In Pipeline"
  | "In Pipeline (Enhancement)"
  | "In Pipeline for July"
  | "In Pipeline for August"
  | "In-Pipeline On Demand"
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
  /** Primary (current, FY27) taxonomy. solutionArea === fy27Area, skillArea === fy27Play. */
  solutionArea: SolutionArea | string;
  skillArea: string | null;
  /** FY26 -> FY27 solution-area and solution-play crosswalk (from the v2 catalogue). */
  fy26Area: string | null;
  fy26Play: string | null;
  fy27Area: string;
  fy27Play: string | null;
  /** New FY27 lab name when the lab was renamed/rebranded for Build 2026. */
  fy27Title: string | null;
  level: Level | null;
  /** Delivery style: "Self Paced" | "Planned Deliveries" | "Instructor Led". */
  style: string | null;
  /** Access/duration window in hours (null when unspecified). */
  durationHours: number | null;
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
  /** The customer / organization the vouchers are for. */
  customerName: string | null;
  purpose: VoucherPurpose | null;
  delivery: PlannedDeliveryDetails | null;
  /** ETA: the date the requester needs the vouchers by (null if not given). */
  neededBy: string | null;
  status: RequestStatus;
  submittedAt: string;
  slaDueAt: string | null;
  notes: string | null;
  vouchers: string[];
}
