"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lab, Lifecycle, SandboxRequest } from "./types";
import { evaluate, slaDueAt } from "./rules";
import { LABS, labMap } from "./labs";

export type Role = "requester" | "admin";

/** Apply a lab's persisted lifecycle override (admin actions) on top of seed. */
export function withOverride(lab: Lab, overrides: Record<string, Lifecycle>): Lab {
  const next = overrides[lab.id];
  if (!next || next === lab.lifecycle) return lab;
  const requestable = next === "Ready" || next === "InUse" || next === "Stale";
  return { ...lab, lifecycle: next, requestable };
}

function genCodes(lab: Lab | undefined, qty: number): string[] {
  const prefix = (lab?.type ?? "lab").slice(0, 3).toUpperCase();
  return Array.from({ length: qty }, () => {
    const a = Math.floor(1000 + Math.random() * 8999);
    const b = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${prefix}-${a}-${b}`;
  });
}

interface DemoSeed {
  requests: SandboxRequest[];
  lifecycleOverrides: Record<string, Lifecycle>;
}

/** A small, believable history so the dashboards aren't empty on first run. */
function buildDemo(): DemoSeed {
  const ready = LABS.find((l) => l.lifecycle === "Ready" && l.type === "guided-lab");
  const inuse = LABS.find((l) => l.lifecycle === "InUse" && l.type === "guided-lab");
  const stale = LABS.find((l) => l.lifecycle === "Stale");
  const hack = LABS.find((l) => l.type === "hiad" && l.requestable);
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const reqs: SandboxRequest[] = [];

  if (ready) {
    reqs.push({
      id: "REQ-1042", kind: "voucher", labId: ready.id, labTitle: ready.title,
      requesterName: "Prashanti Tembhare", requesterOrg: "WaferWire LLC",
      quantity: 25, purpose: "planned-delivery",
      delivery: { engagement: "Copilot Enablement Workshop", partner: "Contoso", startDate: new Date(now + 6 * 864e5).toISOString().slice(0, 10), endDate: new Date(now + 7 * 864e5).toISOString().slice(0, 10), expectedAttendees: 25 },
      status: "instant-fulfilled", submittedAt: iso(3 * 864e5), slaDueAt: null,
      notes: null, vouchers: genCodes(ready, 25),
    });
  }
  if (hack) {
    reqs.push({
      id: "REQ-1051", kind: "voucher", labId: hack.id, labTitle: hack.title,
      requesterName: "Prashanti Tembhare", requesterOrg: "WaferWire LLC",
      quantity: 12, purpose: "self-paced", delivery: null,
      status: "instant-fulfilled", submittedAt: iso(1.2 * 864e5), slaDueAt: null,
      notes: null, vouchers: genCodes(hack, 12),
    });
  }
  if (stale) {
    const dec = evaluate(stale);
    reqs.push({
      id: "REQ-1058", kind: "voucher", labId: stale.id, labTitle: stale.title,
      requesterName: "Prashanti Tembhare", requesterOrg: "WaferWire LLC",
      quantity: 30, purpose: "planned-delivery",
      delivery: { engagement: "Fabric Bootcamp", partner: "Fabrikam", startDate: new Date(now + 9 * 864e5).toISOString().slice(0, 10), endDate: new Date(now + 11 * 864e5).toISOString().slice(0, 10), expectedAttendees: 30 },
      status: "held", submittedAt: iso(0.4 * 864e5),
      slaDueAt: slaDueAt(dec, new Date(now - 0.4 * 864e5)), notes: null, vouchers: [],
    });
  }
  if (inuse) {
    reqs.push({
      id: "REQ-1061", kind: "voucher", labId: inuse.id, labTitle: inuse.title,
      requesterName: "Prashanti Tembhare", requesterOrg: "WaferWire LLC",
      quantity: 8, purpose: "self-paced", delivery: null,
      status: "instant-fulfilled", submittedAt: iso(0.1 * 864e5), slaDueAt: null,
      notes: null, vouchers: genCodes(inuse, 8),
    });
  }
  return { requests: reqs, lifecycleOverrides: {} };
}

interface PortalState {
  role: Role;
  requests: SandboxRequest[];
  lifecycleOverrides: Record<string, Lifecycle>;
  seeded: boolean;
  setRole: (r: Role) => void;
  submitRequest: (input: {
    lab: Lab; quantity: number; purpose: SandboxRequest["purpose"];
    delivery: SandboxRequest["delivery"]; requesterName: string; requesterOrg: string;
  }) => SandboxRequest;
  setLifecycle: (labId: string, next: Lifecycle) => { released: SandboxRequest[] };
  resetDemo: () => void;
}

let seq = 1100;

export const usePortal = create<PortalState>()(
  persist(
    (set, get) => ({
      role: "requester",
      ...buildDemo(),
      seeded: true,

      setRole: (role) => set({ role }),

      submitRequest: ({ lab, quantity, purpose, delivery, requesterName, requesterOrg }) => {
        const live = withOverride(lab, get().lifecycleOverrides);
        const dec = evaluate(live, { quantity });
        const now = new Date();
        seq += 1;
        const status: SandboxRequest["status"] =
          dec.outcome === "instant" ? "instant-fulfilled" : dec.outcome === "held" ? "held" : "blocked";
        const req: SandboxRequest = {
          id: `REQ-${seq}`, kind: "voucher", labId: lab.id, labTitle: lab.title,
          requesterName, requesterOrg, quantity, purpose, delivery, status,
          submittedAt: now.toISOString(),
          slaDueAt: slaDueAt(dec, now),
          notes: dec.message,
          vouchers: dec.outcome === "instant" ? genCodes(lab, quantity) : [],
        };
        set({ requests: [req, ...get().requests] });
        return req;
      },

      setLifecycle: (labId, next) => {
        set({ lifecycleOverrides: { ...get().lifecycleOverrides, [labId]: next } });
        // Auto-release any held requests waiting on this lab when it becomes Ready.
        const released: SandboxRequest[] = [];
        if (next === "Ready" || next === "InUse") {
          const lab = labMap.get(labId);
          set({
            requests: get().requests.map((r) => {
              if (r.labId === labId && r.status === "held") {
                const fulfilled: SandboxRequest = {
                  ...r, status: "fulfilled", vouchers: genCodes(lab, r.quantity), slaDueAt: null,
                };
                released.push(fulfilled);
                return fulfilled;
              }
              return r;
            }),
          });
        }
        return { released };
      },

      resetDemo: () => set({ ...buildDemo(), seeded: true }),
    }),
    { name: "sandbox-portal-v1" }
  )
);
