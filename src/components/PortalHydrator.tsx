"use client";

import { useEffect } from "react";
import { usePortal } from "@/lib/store";

/** Loads the centralized portal store (requests + overrides) once on mount. */
export function PortalHydrator() {
  const hydrate = usePortal((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}
