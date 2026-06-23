"use client";

import { useEffect } from "react";
import { pushRecent } from "@/lib/recent";

/** Records a lab view into the recently-viewed list. Renders nothing. */
export function RecentRecorder({ id }: { id: string }) {
  useEffect(() => {
    pushRecent(id);
  }, [id]);
  return null;
}
