import Link from "next/link";
import { ArrowRightIcon, LayersIcon, ClockIcon, SparklesIcon } from "lucide-react";
import type { Lab } from "@/lib/types";
import { TYPE_META } from "@/lib/state";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LabCard({ lab }: { lab: Lab }) {
  const meta = TYPE_META[lab.type];
  // Subtle per-offering-type accent, all within the CloudLabs violet family.
  const accent = meta.accent;
  const accent2 = meta.accent2;

  return (
    <article className="group relative h-full">
      <Link
        href={`/labs/${lab.id}`}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-all duration-200",
          "hover:border-primary/40 hover:shadow-lg motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        )}
      >
        {/* accent strip — offering-type tint, violet family */}
        <div
          aria-hidden
          className="h-1"
          style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent2} 100%)` }}
        />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 24%, transparent)`,
                background: `color-mix(in srgb, ${accent} 9%, transparent)`,
                color: accent,
              }}
            >
              <LayersIcon className="size-5" />
            </span>
            <LifecycleBadge state={lab.lifecycle} size="sm" />
          </div>

          <p className="mt-4 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
            {meta.label}
          </p>
          <h3 className="mt-1 line-clamp-2 font-semibold text-[15px] leading-snug">{lab.title}</h3>

          {lab.fy27Play && (
            <p className="mt-1.5 truncate text-primary/85 text-xs font-medium" title={lab.fy27Play}>
              {lab.fy27Play}
            </p>
          )}

          <p className="mt-3 line-clamp-2 flex items-start gap-1.5 text-muted-foreground text-sm leading-relaxed">
            <SparklesIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span className="line-clamp-2">{lab.hook}</span>
          </p>

          {lab.products.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {lab.products.slice(0, 3).map((p) => (
                <Badge key={p} variant="secondary" className="font-normal">
                  {p}
                </Badge>
              ))}
              {lab.products.length > 3 && (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  +{lab.products.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3.5">
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
              {lab.level ?? "All levels"}
              {lab.durationHours ? (
                <>
                  <span className="text-border">·</span>
                  <ClockIcon className="size-3" />
                  {lab.durationHours}h
                </>
              ) : null}
            </span>
            <span className="flex items-center gap-1 font-medium text-primary text-xs opacity-0 transition-opacity group-hover:opacity-100">
              View <ArrowRightIcon className="size-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
