"use server";

import { getSession } from "@/lib/auth/session";
import * as repo from "./requests";
import type { Lifecycle, SandboxRequest } from "@/lib/types";

export interface PortalData {
  requests: SandboxRequest[];
  overrides: Record<string, Lifecycle>;
  me: { username: string; email: string; role: string } | null;
}

/** Current shared portal state (requests + admin lifecycle overrides + viewer). */
export async function getPortalDataAction(): Promise<PortalData> {
  const session = await getSession();
  if (!session) return { requests: [], overrides: {}, me: null };
  const { requests, overrides } = await repo.getPortal();
  return { requests, overrides, me: { username: session.username, email: session.email, role: session.role } };
}

export async function submitRequestAction(input: {
  labId: string;
  quantity: number;
  customerName: string | null;
  neededBy: string | null;
  customRequirements: string | null;
}): Promise<SandboxRequest> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in.");
  return repo.submitRequest({
    labId: input.labId,
    quantity: Math.max(1, Math.floor(input.quantity) || 1),
    customerName: input.customerName,
    neededBy: input.neededBy,
    customRequirements: input.customRequirements,
    requesterName: session.username,
    requesterOrg: session.email,
  });
}

export async function setLifecycleAction(labId: string, next: Lifecycle): Promise<PortalData> {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Not authorized.");
  const { requests, overrides } = await repo.setLifecycleOverride(labId, next);
  return { requests, overrides, me: { username: session.username, email: session.email, role: session.role } };
}

export async function resetDemoAction(): Promise<PortalData> {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Not authorized.");
  const { requests, overrides } = await repo.resetDemo();
  return { requests, overrides, me: { username: session.username, email: session.email, role: session.role } };
}
