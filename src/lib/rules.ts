/**
 * The fulfillment rules engine, the heart of the portal.
 *
 * Encodes the Sandbox team's voucher-issuance playbook (PRD §8) as a pure,
 * testable decision function. Given a lab's live state and a request, it
 * decides: issue instantly, hold-and-route, or block, with the routing target
 * and SLA clock. Kept free of UI and I/O so the business logic stays auditable
 * and changeable without touching anything else.
 */
import type { Lab, SandboxRequest } from "./types";
import { lifecycleConfig } from "./state";

export type Outcome = "instant" | "held" | "blocked";

export interface SlaTarget {
  /** human label shown to the requester */
  label: string;
  /** hours from submission until the commitment is due */
  hours: number;
}

export interface FulfillmentDecision {
  outcome: Outcome;
  /** machine-readable reason code */
  code: string;
  /** requester-facing explanation */
  message: string;
  /** where a held request is routed */
  routeTo: string | null;
  sla: SlaTarget | null;
  /** context the held-request notification must carry (PRD §8.1) */
  context: {
    activePartners: string[];
    vouchersRedeemed: number;
    lastRedeemed: string | null;
    lastRefresh: string | null;
  };
}

/** SLA targets (PRD §10, initial targets, confirm with Sandbox team). */
export const SLA = {
  instant: { label: "Issued immediately", hours: 0 },
  held: { label: "Within 3 days", hours: 72 },
} as const;

const MSN_INBOX = "MSN inbox + Cloud Support team";

export function evaluate(lab: Lab, _request?: Partial<SandboxRequest>): FulfillmentDecision {
  const cfg = lifecycleConfig(lab.lifecycle);
  const context = {
    activePartners: lab.activePartners,
    vouchersRedeemed: lab.vouchers.redeemed,
    lastRedeemed: lab.vouchers.lastRedeemed,
    lastRefresh: lab.lastRefresh,
  };

  // Retired / not-built → blocked (visible but not requestable).
  if (!lab.requestable || cfg.outcome === "blocked" || cfg.outcome === "coming-soon") {
    return {
      outcome: "blocked",
      code: cfg.outcome === "coming-soon" ? "not-built" : "retired",
      message:
        cfg.outcome === "coming-soon"
          ? "This track is still being built and validated. It isn't requestable yet."
          : "This track has been retired and is no longer requestable.",
      routeTo: null,
      sla: null,
      context,
    };
  }

  // Ready / In Use → instant issuance.
  if (cfg.outcome === "instant") {
    return {
      outcome: "instant",
      code: lab.lifecycle === "InUse" ? "ready-active" : "ready",
      message:
        "This lab is verified ready. Your voucher code is generated instantly and shown in-app.",
      routeTo: null,
      sla: { ...SLA.instant },
      context,
    };
  }

  // Stale → held, routed for validation against the SLA.
  return {
    outcome: "held",
    code: "stale-needs-validation",
    message:
      "This lab needs validation before vouchers can be issued. Your request is held and routed to the Sandbox team; vouchers release automatically once it's marked Ready.",
    routeTo: MSN_INBOX,
    sla: { ...SLA.held },
    context,
  };
}

/** Compute the SLA due timestamp for a decision from a submission time. */
export function slaDueAt(decision: FulfillmentDecision, submittedAt: Date): string | null {
  if (!decision.sla || decision.sla.hours === 0) return null;
  return new Date(submittedAt.getTime() + decision.sla.hours * 3600_000).toISOString();
}
