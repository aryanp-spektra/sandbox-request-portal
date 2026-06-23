"use client";

import { useEffect, useState } from "react";

/** Live countdown to an ISO deadline. Shows breach state when overdue. */
export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = new Date(to).getTime() - now;
  const overdue = diff <= 0;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3.6e6);
  const m = Math.floor((abs % 3.6e6) / 6e4);
  const s = Math.floor((abs % 6e4) / 1000);
  const label = h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m ${String(s).padStart(2, "0")}s`;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[12px] font-bold tabular-nums"
      style={{
        background: overdue ? "var(--st-retired-bg)" : "var(--st-held-bg)",
        color: overdue ? "#b91c1c" : "var(--st-held-ink)",
      }}
    >
      {overdue ? `SLA breached · ${label} over` : `SLA · ${label} left`}
    </span>
  );
}
