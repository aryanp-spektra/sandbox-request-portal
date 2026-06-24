"use client";

import { create } from "zustand";
import type { Lifecycle, SandboxRequest } from "./types";
import {
  getPortalDataAction,
  submitRequestAction,
  setLifecycleAction,
  resetDemoAction,
} from "./data/portal-actions";

// withOverride is pure and isomorphic; re-exported here so existing imports
// (`import { withOverride } from "@/lib/store"`) keep working.
export { withOverride } from "./lifecycle-util";

/**
 * Client cache over the centralized portal store. Requests, voucher codes and
 * admin lifecycle overrides are persisted server-side (Azure Blob / file) via
 * the portal actions; this store hydrates from them and mirrors mutations so
 * the UI stays responsive. No more per-browser localStorage source of truth.
 */
export interface Viewer {
  username: string;
  email: string;
  role: string;
}

interface PortalState {
  requests: SandboxRequest[];
  lifecycleOverrides: Record<string, Lifecycle>;
  me: Viewer | null;
  hydrated: boolean;
  loading: boolean;
  hydrate: () => Promise<void>;
  submitRequest: (input: {
    labId: string;
    quantity: number;
    customerName: string | null;
    neededBy: string | null;
    customRequirements: string | null;
  }) => Promise<SandboxRequest>;
  setLifecycle: (labId: string, next: Lifecycle) => Promise<void>;
  resetDemo: () => Promise<void>;
}

export const usePortal = create<PortalState>((set, get) => ({
  requests: [],
  lifecycleOverrides: {},
  me: null,
  hydrated: false,
  loading: false,

  hydrate: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await getPortalDataAction();
      set({ requests: data.requests, lifecycleOverrides: data.overrides, me: data.me, hydrated: true });
    } finally {
      set({ loading: false });
    }
  },

  submitRequest: async (input) => {
    const req = await submitRequestAction(input);
    set({ requests: [req, ...get().requests] });
    return req;
  },

  setLifecycle: async (labId, next) => {
    const data = await setLifecycleAction(labId, next);
    set({ requests: data.requests, lifecycleOverrides: data.overrides });
  },

  resetDemo: async () => {
    const data = await resetDemoAction();
    set({ requests: data.requests, lifecycleOverrides: data.overrides });
  },
}));
