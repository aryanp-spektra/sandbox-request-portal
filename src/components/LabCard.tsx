"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Layers, RefreshCw, Ticket, Clock, Ban } from "lucide-react";
import type { Lab } from "@/lib/types";
import { TYPE_META, lifecycleConfig } from "@/lib/state";
import { SNAPSHOT_AT } from "@/lib/labs";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";

function refreshLabel(iso: string | null) {
  if (!iso) return "Not yet built";
  const days = Math.round((SNAPSHOT_AT - new Date(iso).getTime()) / 864e5);
  if (days <= 1) return "Refreshed today";
  if (days < 30) return `Refreshed ${days}d ago`;
  if (days < 60) return "Refreshed 1mo ago";
  return `Refreshed ${Math.round(days / 30)}mo ago`;
}

export function LabCard({ lab, index = 0, onRequest }: { lab: Lab; index?: number; onRequest?: (lab: Lab) => void }) {
  const meta = TYPE_META[lab.type];
  const cfg = lifecycleConfig(lab.lifecycle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/catalog/${lab.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-[16px] border border-line bg-surface shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-[var(--shadow-lift)]"
      >
        {/* accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${meta.accent}, ${meta.accent2})` }} />

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
              style={{ color: meta.accent }}
            >
              <Layers className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            {lab.isNew && (
              <span className="rounded-md bg-violet/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-violet">
                New
              </span>
            )}
            <span className="ml-auto">
              <LifecycleBadge state={lab.lifecycle} size="sm" />
            </span>
          </div>

          {lab.level && (
            <span className="mb-1.5 text-[12px] font-semibold text-faint">
              {lab.solutionArea} · {lab.level}
            </span>
          )}

          <h3 className="clamp-2 mb-2 min-h-[44px] font-display text-[16.5px] font-bold leading-snug text-ink">
            {lab.title}
          </h3>
          <p className="clamp-2 mb-4 text-[13px] leading-relaxed text-mut">{lab.overview}</p>

          {lab.products.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {lab.products.slice(0, 3).map((p) => (
                <span key={p} className="rounded-md bg-line2 px-2 py-0.5 text-[11px] font-medium text-slate">
                  {p}
                </span>
              ))}
              {lab.products.length > 3 && (
                <span className="rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  +{lab.products.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-line2 pt-3.5">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-faint">
              <RefreshCw className="h-3.5 w-3.5" />
              {refreshLabel(lab.lastRefresh)}
            </span>
            {lab.requestable && onRequest ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRequest(lab); }}
                className="inline-flex flex-none items-center gap-1.5 rounded-[10px] aurora-fill px-3 py-1.5 text-[12px] font-bold text-white shadow-soft transition-all hover:brightness-105"
              >
                <Ticket className="h-3.5 w-3.5" /> Request voucher
              </button>
            ) : (
              <span className="flex flex-none items-center gap-1 text-[12px] font-bold" style={{ color: cfg.outcome === "blocked" ? "var(--color-retired)" : "var(--color-testing)" }}>
                {cfg.outcome === "blocked" ? <Ban className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {cfg.outcome === "blocked" ? "Retired" : "Coming soon"}
                <ArrowUpRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
