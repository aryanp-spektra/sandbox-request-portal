import seed from "../data/labs.json";
import meta from "../data/meta.json";
import type { Lab, Lifecycle } from "./types";

export const LABS = seed as Lab[];
export const labMap = new Map(LABS.map((l) => [l.id, l]));

export const META = meta as { generatedAt: string; labCount: number };

/**
 * A stable, deterministic "now" for relative-time labels (e.g. "Updated 3d ago").
 * Anchored to the catalog snapshot time so the value is identical on the server
 * and the client, avoiding hydration mismatches and impure Date.now() in render.
 */
export const SNAPSHOT_AT = new Date(META.generatedAt).getTime();

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

const uniqSorted = (xs: (string | null)[]) =>
  [...new Set(xs.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));

export const FACETS = {
  solutionAreas: uniqSorted(LABS.map((l) => l.solutionArea)),
  skillAreas: uniqSorted(LABS.map((l) => l.skillArea)),
  levels: ["Beginner", "Intermediate", "Advanced"],
  types: [...new Map(LABS.map((l) => [l.type, l.typeLabel])).entries()].map(([id, label]) => ({ id, label })),
  products: uniqSorted(LABS.flatMap((l) => l.products)),
  // FY26 -> FY27 mapping dimensions
  fy26Areas: uniqSorted(LABS.map((l) => l.fy26Area)),
  fy26Plays: uniqSorted(LABS.map((l) => l.fy26Play)),
  fy27Areas: uniqSorted(LABS.map((l) => l.fy27Area)),
  fy27Plays: uniqSorted(LABS.map((l) => l.fy27Play)),
};

export interface CrosswalkRow {
  fy26Area: string;
  fy26Play: string;
  fy27Area: string;
  fy27Play: string;
  count: number;
  labIds: string[];
}

/**
 * FY26 -> FY27 solution-play crosswalk, derived from the labs themselves.
 * One row per distinct (FY26 play -> FY27 play) pairing, with the labs that
 * carry it. Sorted by FY26 area then descending lab count.
 */
export function crosswalk(): CrosswalkRow[] {
  const m = new Map<string, CrosswalkRow>();
  for (const l of LABS) {
    if (!l.fy26Play || !l.fy27Play) continue;
    const key = `${l.fy26Play}>>${l.fy27Play}`;
    const row = m.get(key);
    if (row) {
      row.count++;
      row.labIds.push(l.id);
    } else {
      m.set(key, {
        fy26Area: l.fy26Area ?? "Unmapped",
        fy26Play: l.fy26Play,
        fy27Area: l.fy27Area,
        fy27Play: l.fy27Play,
        count: 1,
        labIds: [l.id],
      });
    }
  }
  return [...m.values()].sort(
    (a, b) => a.fy26Area.localeCompare(b.fy26Area) || b.count - a.count
  );
}
