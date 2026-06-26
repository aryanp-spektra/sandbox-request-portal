import "server-only";
import { mutate, readJson } from "./store";

/**
 * Lab "interest" stars. A lightweight, anonymous signal: anyone browsing the
 * catalog can star a lab they'd like to see / run. Counts are aggregated per
 * lab so the team can see which technologies and lab types draw the most
 * interest, a complement to actual voucher requests.
 *
 * Stored in its own collection (not the auth-gated portal doc) so the public
 * catalog can write to it. Per-browser de-duplication lives in localStorage on
 * the client; this store just holds the running totals.
 */
const COLLECTION = "stars";
type StarsDoc = Record<string, number>;

export async function getStars(): Promise<StarsDoc> {
  return readJson<StarsDoc>(COLLECTION, {});
}

export async function getStarCount(labId: string): Promise<number> {
  const all = await getStars();
  return all[labId] ?? 0;
}

/** Increment (on=true) or decrement (on=false) a lab's star count, clamped ≥ 0. */
export async function toggleStar(labId: string, on: boolean): Promise<number> {
  const doc = await mutate<StarsDoc>(COLLECTION, {}, (cur) => {
    const next = { ...cur };
    next[labId] = Math.max(0, (next[labId] ?? 0) + (on ? 1 : -1));
    return next;
  });
  return doc[labId] ?? 0;
}
