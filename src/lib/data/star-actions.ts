"use server";

import { toggleStar, getStars } from "./stars";

/** Toggle a lab's interest star. Anonymous, no session required. */
export async function toggleStarAction(labId: string, on: boolean): Promise<number> {
  if (!labId) throw new Error("Missing lab id.");
  return toggleStar(labId, on);
}

/** All star counts keyed by lab id (for admin / dashboards). */
export async function getStarCountsAction(): Promise<Record<string, number>> {
  return getStars();
}
