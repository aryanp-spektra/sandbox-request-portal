import "server-only";
import { mutate } from "./store";
import { LABS, labMap } from "@/lib/labs";
import { evaluate, slaDueAt } from "@/lib/rules";
import type { Lab, Lifecycle, SandboxRequest, VoucherPurpose, PlannedDeliveryDetails } from "@/lib/types";

/**
 * Centralized request store. The requests, voucher codes and admin lifecycle
 * overrides used to live in each browser's localStorage (so a requester's
 * submissions never reached the admin). They now live here, in the shared JSON
 * store, as a single "portal" document.
 */
const COLLECTION = "portal";

export interface PortalDoc {
  requests: SandboxRequest[];
  overrides: Record<string, Lifecycle>;
  seeded: boolean;
}

const EMPTY: PortalDoc = { requests: [], overrides: {}, seeded: false };

let seq = 1100;
function nextId(doc: PortalDoc): string {
  // Keep ids ahead of anything already stored across restarts.
  const max = doc.requests.reduce((m, r) => {
    const n = Number(r.id.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, seq);
  seq = max + 1;
  return `REQ-${seq}`;
}

function genCodes(lab: Lab | undefined, qty: number): string[] {
  const prefix = (lab?.type ?? "lab").slice(0, 3).toUpperCase();
  return Array.from({ length: qty }, () => {
    const a = Math.floor(1000 + Math.random() * 8999);
    const b = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${prefix}-${a}-${b}`;
  });
}

/** A small, believable history so the dashboards aren't empty on first run. */
function buildDemo(): PortalDoc {
  const ready = LABS.find((l) => l.lifecycle === "Ready" && l.type === "guided-lab");
  const inuse = LABS.find((l) => l.lifecycle === "InUse" && l.type === "guided-lab");
  const stale = LABS.find((l) => l.lifecycle === "Stale");
  const hack = LABS.find((l) => l.type === "hiad" && l.requestable);
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const day = (n: number) => new Date(now + n * 864e5).toISOString().slice(0, 10);
  const requests: SandboxRequest[] = [];
  const mk = (
    id: string, lab: Lab, quantity: number, customerName: string | null, purpose: VoucherPurpose | null,
    delivery: PlannedDeliveryDetails | null, neededBy: string | null,
    status: SandboxRequest["status"], submittedMsAgo: number, vouchers: string[], sla: string | null
  ): SandboxRequest => ({
    id, kind: "voucher", labId: lab.id, labTitle: lab.title,
    requesterName: "Prashanti Tembhare", requesterOrg: "WaferWire LLC",
    quantity, customerName, purpose, delivery, neededBy, status,
    submittedAt: iso(submittedMsAgo), slaDueAt: sla, notes: null, vouchers,
  });

  if (ready) requests.push(mk("REQ-1042", ready, 25, "Contoso", "planned-delivery",
    { engagement: "Copilot Enablement Workshop", partner: "Contoso", startDate: day(6), endDate: day(7), expectedAttendees: 25 },
    day(6), "instant-fulfilled", 3 * 864e5, genCodes(ready, 25), null));
  if (hack) requests.push(mk("REQ-1051", hack, 12, "Northwind Traders", "self-paced", null, null,
    "instant-fulfilled", 1.2 * 864e5, genCodes(hack, 12), null));
  if (stale) {
    const dec = evaluate(stale);
    requests.push(mk("REQ-1058", stale, 30, "Fabrikam", "planned-delivery",
      { engagement: "Fabric Bootcamp", partner: "Fabrikam", startDate: day(9), endDate: day(11), expectedAttendees: 30 },
      day(9), "held", 0.4 * 864e5, [], slaDueAt(dec, new Date(now - 0.4 * 864e5))));
  }
  if (inuse) requests.push(mk("REQ-1061", inuse, 8, "Adventure Works", "self-paced", null, null,
    "instant-fulfilled", 0.1 * 864e5, genCodes(inuse, 8), null));

  return { requests, overrides: {}, seeded: true };
}

/** Read the portal doc, seeding demo data on first ever access. */
export async function getPortal(): Promise<PortalDoc> {
  return mutate<PortalDoc>(COLLECTION, EMPTY, (doc) => (doc.seeded ? doc : buildDemo()));
}

export interface SubmitInput {
  labId: string;
  quantity: number;
  customerName: string | null;
  neededBy: string | null;
  customRequirements: string | null;
  requesterName: string;
  requesterOrg: string;
}

/** Persist a support-channel voucher request (no codes issued in-portal). */
export async function submitRequest(input: SubmitInput): Promise<SandboxRequest> {
  const lab = labMap.get(input.labId);
  if (!lab) throw new Error("Unknown lab.");
  let created: SandboxRequest | null = null;
  await mutate<PortalDoc>(COLLECTION, EMPTY, (raw) => {
    const doc = raw.seeded ? raw : buildDemo();
    created = {
      id: nextId(doc), kind: "voucher", labId: lab.id, labTitle: lab.title,
      requesterName: input.requesterName, requesterOrg: input.requesterOrg,
      quantity: input.quantity, customerName: (input.customerName && input.customerName.trim()) || null,
      purpose: null, delivery: null, neededBy: input.neededBy,
      status: "submitted", submittedAt: new Date().toISOString(), slaDueAt: null,
      notes: (input.customRequirements && input.customRequirements.trim()) || null, vouchers: [],
    };
    return { ...doc, requests: [created!, ...doc.requests] };
  });
  return created!;
}

/** Admin lifecycle override; auto-releases held requests when a lab goes live. */
export async function setLifecycleOverride(labId: string, next: Lifecycle): Promise<PortalDoc> {
  return mutate<PortalDoc>(COLLECTION, EMPTY, (raw) => {
    const doc = raw.seeded ? raw : buildDemo();
    const overrides = { ...doc.overrides, [labId]: next };
    let requests = doc.requests;
    if (next === "Ready" || next === "InUse") {
      const lab = labMap.get(labId);
      requests = doc.requests.map((r) =>
        r.labId === labId && r.status === "held"
          ? { ...r, status: "fulfilled", vouchers: genCodes(lab, r.quantity), slaDueAt: null }
          : r
      );
    }
    return { ...doc, overrides, requests };
  });
}

export async function resetDemo(): Promise<PortalDoc> {
  return mutate<PortalDoc>(COLLECTION, EMPTY, () => buildDemo());
}
