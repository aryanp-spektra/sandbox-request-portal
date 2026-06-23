import { lifecycleConfig } from "@/lib/state";
import type { Lifecycle } from "@/lib/types";

export function StateBadge({ state }: { state: Lifecycle }) {
  const cfg = lifecycleConfig(state);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[10.5px] font-extrabold uppercase tracking-wide"
      style={{ background: cfg.bg, color: cfg.ink }}
    >
      {cfg.badge}
    </span>
  );
}
