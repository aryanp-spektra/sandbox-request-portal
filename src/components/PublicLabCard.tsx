"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, RefreshCw, ArrowUpRight, Sparkles, Clock, Check, Plus } from "lucide-react";
import type { Lab } from "@/lib/types";
import { TYPE_META } from "@/lib/state";
import { SNAPSHOT_AT } from "@/lib/labs";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { cn } from "@/lib/cn";

function refreshLabel(iso: string | null) {
  if (!iso) return "New for Build 2026";
  const days = Math.round((SNAPSHOT_AT - new Date(iso).getTime()) / 864e5);
  if (days <= 1) return "Updated today";
  if (days < 30) return `Updated ${days}d ago`;
  if (days < 60) return "Updated 1mo ago";
  return `Updated ${Math.round(days / 30)}mo ago`;
}

export function PublicLabCard({
  lab,
  index = 0,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  lab: Lab;
  index?: number;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const meta = TYPE_META[lab.type];
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.025, 0.25), ease: [0.22, 1, 0.36, 1] }}
    >
      {selectable && (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? `Remove ${lab.title} from compare` : `Add ${lab.title} to compare`}
          aria-pressed={selected}
          className={cn(
            "absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full border shadow-soft transition-all",
            selected
              ? "border-transparent bg-primary text-white"
              : "border-line bg-surface/90 text-faint backdrop-blur hover:border-primary hover:text-primary"
          )}
        >
          {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      )}
      <Link
        href={`/labs/${lab.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-[16px] border border-line bg-surface shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-[var(--shadow-lift)]"
      >
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${meta.accent}, ${meta.accent2})` }} />
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: meta.accent }}>
              <Layers className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            {lab.isNew && (
              <span className="rounded-md bg-violet/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-violet">New</span>
            )}
            <span className="ml-auto">
              <LifecycleBadge state={lab.lifecycle} size="sm" />
            </span>
          </div>

          <h3 className="mb-1.5 font-display text-[16.5px] font-bold leading-snug text-ink clamp-2 min-h-[44px]">
            {lab.title}
          </h3>

          {lab.fy27Play && (
            <p className="mb-2.5 truncate text-[11.5px] font-semibold text-primary/80" title={`FY27 solution play: ${lab.fy27Play}`}>
              {lab.fy27Play}
            </p>
          )}

          {/* the interest hook, the hero of this card */}
          <p className="mb-4 flex items-start gap-1.5 text-[13px] font-medium leading-relaxed text-slate">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
            <span className="clamp-2">{lab.hook}</span>
          </p>

          {lab.products.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {lab.products.slice(0, 3).map((p) => (
                <span key={p} className="rounded-md bg-line2 px-2 py-0.5 text-[11px] font-medium text-slate">{p}</span>
              ))}
              {lab.products.length > 3 && (
                <span className="rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">+{lab.products.length - 3}</span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-line2 pt-3.5">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-faint">
              {lab.level ? <>{lab.level}</> : "All levels"}
              {lab.durationHours ? (
                <>
                  <span className="text-line">·</span>
                  <Clock className="h-3 w-3" />
                  {lab.durationHours}h
                </>
              ) : (
                <>
                  <span className="text-line">·</span>
                  <RefreshCw className="h-3 w-3" />
                  {refreshLabel(lab.lastRefresh)}
                </>
              )}
            </span>
            <span className="flex items-center gap-1 text-[12.5px] font-bold text-primary">
              View
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
