import seed from "../data/labs.json";
import meta from "../data/meta.json";
import type { Lab, Lifecycle } from "./types";

export const LABS = seed as Lab[];
export const labMap = new Map(LABS.map((l) => [l.id, l]));

export const META = meta as { generatedAt: string; labCount: number };

/** Deterministic UTC label for "Last updated" (no locale/timezone drift). */
export function lastUpdatedLabel(): string {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(META.generatedAt);
  const day = d.getUTCDate();
  const mon = MONTHS[d.getUTCMonth()];
  const yr = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${mon} ${yr}, ${hh}:${mm} UTC`;
}

export function getLab(id: string): Lab | undefined {
  return labMap.get(id);
}

/** Catalog stats for hero / dashboards. */
export function catalogStats() {
  const counts = LABS.reduce<Record<Lifecycle, number>>(
    (a, l) => ((a[l.lifecycle] = (a[l.lifecycle] ?? 0) + 1), a),
    {} as Record<Lifecycle, number>
  );
  return {
    total: LABS.length,
    requestable: LABS.filter((l) => l.requestable).length,
    instant: (counts.Ready ?? 0) + (counts.InUse ?? 0),
    solutionAreas: new Set(LABS.map((l) => l.solutionArea)).size,
    types: new Set(LABS.map((l) => l.type)).size,
    counts,
  };
}

/** A handful of strong, requestable labs for the landing showcase. */
export function featured(n = 6): Lab[] {
  return LABS.filter((l) => l.requestable && l.products.length >= 3 && l.lifecycle === "Ready")
    .sort((a, b) => b.vouchers.redeemed - a.vouchers.redeemed)
    .slice(0, n);
}

export const FACETS = {
  solutionAreas: [...new Set(LABS.map((l) => l.solutionArea))].sort(),
  skillAreas: [...new Set(LABS.map((l) => l.skillArea).filter(Boolean) as string[])].sort(),
  levels: ["Beginner", "Intermediate", "Advanced"],
  types: [...new Map(LABS.map((l) => [l.type, l.typeLabel])).entries()].map(([id, label]) => ({ id, label })),
  products: [...new Set(LABS.flatMap((l) => l.products))].sort(),
};
