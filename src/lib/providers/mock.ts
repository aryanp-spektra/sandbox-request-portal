/**
 * Mock provider implementations, backed by the seeded FY27 catalogue.
 *
 * In-memory and process-local, fine for the beta. State mutations (issuing
 * vouchers, flipping lifecycle) persist for the life of the server process so
 * the demo flows feel real. Swap these for CloudLabs-backed implementations
 * later without touching callers.
 */
import seed from "../../data/labs.json";
import type { Lab, Lifecycle } from "../types";
import type {
  CatalogProvider,
  CatalogQuery,
  ReadinessProvider,
  VoucherProvider,
} from "./types";

// Clone the seed so mutations don't corrupt the imported module.
const labs: Lab[] = (seed as Lab[]).map((l) => ({ ...l, vouchers: { ...l.vouchers } }));
const byId = new Map(labs.map((l) => [l.id, l]));

const LIFECYCLE_ORDER: Lifecycle[] = ["Ready", "InUse", "Stale", "InTesting", "Retired"];

function matches(lab: Lab, q: CatalogQuery): boolean {
  if (q.requestableOnly && !lab.requestable) return false;
  if (q.solutionArea && lab.solutionArea !== q.solutionArea) return false;
  if (q.skillArea && lab.skillArea !== q.skillArea) return false;
  if (q.level && lab.level !== q.level) return false;
  if (q.type && lab.type !== q.type) return false;
  if (q.lifecycle && lab.lifecycle !== q.lifecycle) return false;
  if (q.search) {
    const s = q.search.toLowerCase();
    const hay = [lab.title, lab.overview, lab.skillArea, ...lab.products, ...lab.modules]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(s)) return false;
  }
  return true;
}

export const catalog: CatalogProvider = {
  async list(query = {}) {
    return labs.filter((l) => matches(l, query));
  },
  async get(id) {
    return byId.get(id) ?? null;
  },
  async facets() {
    const uniq = (xs: (string | null)[]) =>
      [...new Set(xs.filter((x): x is string => !!x))].sort();
    return {
      solutionAreas: uniq(labs.map((l) => l.solutionArea)),
      skillAreas: uniq(labs.map((l) => l.skillArea)),
      levels: ["Beginner", "Intermediate", "Advanced"],
      types: [...new Map(labs.map((l) => [l.type, l.typeLabel])).entries()].map(
        ([id, label]) => ({ id, label })
      ),
      products: uniq(labs.flatMap((l) => l.products)).slice(0, 60),
    };
  },
};

export const readiness: ReadinessProvider = {
  async matrix() {
    const out = Object.fromEntries(LIFECYCLE_ORDER.map((s) => [s, [] as Lab[]])) as Record<
      Lifecycle,
      Lab[]
    >;
    for (const lab of labs) out[lab.lifecycle].push(lab);
    return out;
  },
  async setLifecycle(id, next) {
    const lab = byId.get(id);
    if (!lab) throw new Error(`Unknown lab: ${id}`);
    lab.lifecycle = next;
    // keep requestability consistent with the new state
    lab.requestable = next === "Ready" || next === "InUse" || next === "Stale";
    if (next === "Ready" || next === "InUse") {
      lab.lastRefresh = new Date().toISOString().slice(0, 10);
    }
    return lab;
  },
};

let voucherSeq = 1000;
export const vouchers: VoucherProvider = {
  async issue(labId, quantity) {
    const lab = byId.get(labId);
    const prefix = (lab?.type ?? "lab").slice(0, 3).toUpperCase();
    const codes: string[] = [];
    for (let i = 0; i < quantity; i++) {
      voucherSeq += 1;
      codes.push(`${prefix}-${voucherSeq}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);
    }
    if (lab) lab.vouchers.issued += quantity;
    return codes;
  },
};
