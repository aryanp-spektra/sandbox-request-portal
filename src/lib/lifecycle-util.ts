import type { Lab, Lifecycle } from "./types";

/** Apply a lab's persisted lifecycle override (admin actions) on top of seed. */
export function withOverride(lab: Lab, overrides: Record<string, Lifecycle>): Lab {
  const next = overrides[lab.id];
  if (!next || next === lab.lifecycle) return lab;
  const requestable = next === "Ready" || next === "InUse" || next === "Stale";
  return { ...lab, lifecycle: next, requestable };
}
