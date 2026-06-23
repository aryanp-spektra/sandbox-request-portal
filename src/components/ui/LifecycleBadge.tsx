import { lifecycleConfig } from "@/lib/state";
import type { Lifecycle } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONE: Record<Lifecycle, { bg: string; ink: string; bd: string; dot: string }> = {
  Ready: { bg: "var(--st-ready-bg)", ink: "var(--st-ready-ink)", bd: "var(--st-ready-bd)", dot: "#10b981" },
  InUse: { bg: "var(--st-inuse-bg)", ink: "var(--st-inuse-ink)", bd: "var(--st-inuse-bd)", dot: "#3b82f6" },
  Stale: { bg: "var(--st-held-bg)", ink: "var(--st-held-ink)", bd: "var(--st-held-bd)", dot: "#f59e0b" },
  InTesting: { bg: "var(--st-testing-bg)", ink: "var(--st-testing-ink)", bd: "var(--st-testing-bd)", dot: "#8b5cf6" },
  Retired: { bg: "var(--st-retired-bg)", ink: "var(--st-retired-ink)", bd: "var(--st-retired-bd)", dot: "#94a3b8" },
};

export function LifecycleBadge({
  state,
  size = "md",
  withDot = true,
}: {
  state: Lifecycle;
  size?: "sm" | "md";
  withDot?: boolean;
}) {
  const cfg = lifecycleConfig(state);
  const t = TONE[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      )}
      style={{ background: t.bg, color: t.ink, borderColor: t.bd }}
    >
      {withDot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: t.dot, boxShadow: `0 0 0 3px ${t.bg}` }}
        />
      )}
      {cfg.badge}
    </span>
  );
}
