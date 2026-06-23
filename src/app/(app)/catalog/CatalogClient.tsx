"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Zap, Check } from "lucide-react";
import { LABS, FACETS } from "@/lib/labs";
import { usePortal, withOverride } from "@/lib/store";
import { TYPE_META } from "@/lib/state";
import type { Lab, Lifecycle } from "@/lib/types";
import { LabCard } from "@/components/LabCard";
import { cn } from "@/lib/cn";

type Sort = "popular" | "az" | "ready";

const LIFECYCLE_FILTERS: { key: Lifecycle | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Ready", label: "Ready" },
  { key: "InUse", label: "In Use" },
  { key: "Stale", label: "Held" },
  { key: "InTesting", label: "Coming soon" },
  { key: "Retired", label: "Retired" },
];

export function CatalogClient() {
  const params = useSearchParams();
  const overrides = usePortal((s) => s.lifecycleOverrides);

  const [q, setQ] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [life, setLife] = useState<Lifecycle | "all">("all");
  const [requestableOnly, setRequestableOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("popular");
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    const a = params.get("area");
    const t = params.get("type");
    if (a) setArea(a);
    if (t) setType(t);
  }, [params]);

  const labs = useMemo<Lab[]>(
    () => LABS.map((l) => withOverride(l, overrides)),
    [overrides]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = labs.filter((l) => {
      if (area && l.solutionArea !== area) return false;
      if (type && l.type !== type) return false;
      if (level && l.level !== level) return false;
      if (life !== "all" && l.lifecycle !== life) return false;
      if (requestableOnly && !l.requestable) return false;
      if (s) {
        const hay = [l.title, l.overview, l.skillArea, ...l.products].join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "ready") return Number(b.requestable) - Number(a.requestable) || b.vouchers.redeemed - a.vouchers.redeemed;
      return b.vouchers.redeemed - a.vouchers.redeemed;
    });
    return out;
  }, [labs, q, area, type, level, life, requestableOnly, sort]);

  const count = (fn: (l: Lab) => boolean) => labs.filter(fn).length;
  const activeCount = [area, type, level, life !== "all" ? life : null, requestableOnly ? "r" : null].filter(Boolean).length;

  const clearAll = () => {
    setArea(null); setType(null); setLevel(null); setLife("all"); setRequestableOnly(false); setQ("");
  };

  return (
    <main className="wrap-wide py-9">
      {/* header */}
      <div className="mb-7">
        <h1 className="font-display text-[34px] font-extrabold tracking-tight text-ink">Lab catalog</h1>
        <p className="mt-1 text-[15px] text-mut">
          {LABS.length} guided labs, hackathons and sandboxes, with live readiness state.
        </p>
      </div>

      {/* search + type pills */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-[13px] border border-line bg-surface px-4 shadow-soft focus-within:border-primary">
          <Search className="h-5 w-5 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search labs, technologies, products…"
            className="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-faint"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-faint hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Pill active={!type} onClick={() => setType(null)}>All types</Pill>
          {FACETS.types.map((t) => (
            <Pill key={t.id} active={type === t.id} onClick={() => setType(type === t.id ? null : t.id)} accent={TYPE_META[t.id as keyof typeof TYPE_META]?.accent}>
              {t.label}
              <span className="opacity-60">{count((l) => l.type === t.id)}</span>
            </Pill>
          ))}
        </div>
      </div>

      <div className="flex gap-7">
        {/* ── filter rail ── */}
        <aside
          className={cn(
            "w-[248px] flex-none lg:block",
            mobileFilters ? "fixed inset-0 z-[90] block overflow-y-auto bg-surface p-5 lg:static lg:p-0" : "hidden"
          )}
        >
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <span className="font-display text-[18px] font-bold">Filters</span>
            <button onClick={() => setMobileFilters(false)}><X className="h-5 w-5" /></button>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            {/* requestable toggle */}
            <button
              onClick={() => setRequestableOnly((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[13px] border p-3.5 text-left transition-all",
                requestableOnly ? "border-primary bg-primary/5" : "border-line bg-surface hover:border-[#cdd2e2]"
              )}
            >
              <span className={cn("grid h-5 w-5 place-items-center rounded-md border", requestableOnly ? "aurora-fill border-transparent" : "border-line2 bg-line2")}>
                {requestableOnly && <Check className="h-3.5 w-3.5 text-white" />}
              </span>
              <span className="flex-1">
                <span className="block text-[13.5px] font-semibold text-ink">Requestable only</span>
                <span className="block text-[12px] text-faint">Hide retired & coming soon</span>
              </span>
              <Zap className="h-4 w-4 text-primary" />
            </button>

            <FilterGroup title="Lifecycle">
              <div className="flex flex-wrap gap-1.5">
                {LIFECYCLE_FILTERS.map((f) => (
                  <Pill key={f.key} active={life === f.key} onClick={() => setLife(f.key as Lifecycle | "all")} size="sm">
                    {f.label}
                  </Pill>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Solution area">
              <FilterList
                options={FACETS.solutionAreas.map((a) => ({ value: a, label: a, n: count((l) => l.solutionArea === a) }))}
                value={area}
                onChange={setArea}
              />
            </FilterGroup>

            <FilterGroup title="Level">
              <div className="flex flex-wrap gap-1.5">
                {FACETS.levels.map((lv) => (
                  <Pill key={lv} active={level === lv} onClick={() => setLevel(level === lv ? null : lv)} size="sm">
                    {lv}
                  </Pill>
                ))}
              </div>
            </FilterGroup>
          </div>
        </aside>

        {/* ── results ── */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMobileFilters(true)}
              className="flex items-center gap-2 rounded-[11px] border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-slate lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount > 0 && ` (${activeCount})`}
            </button>

            <span className="text-[14px] text-mut">
              <b className="text-ink">{filtered.length}</b> {filtered.length === 1 ? "lab" : "labs"}
            </span>

            {activeCount > 0 && (
              <button onClick={clearAll} className="text-[13px] font-semibold text-primary hover:underline">
                Clear filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12.5px] text-faint">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-slate outline-none hover:border-[#cdd2e2] focus:border-primary"
              >
                <option value="popular">Most redeemed</option>
                <option value="ready">Ready first</option>
                <option value="az">A–Z</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-line bg-surface py-20 text-center">
              <p className="font-display text-[18px] font-bold text-ink">No labs match your filters</p>
              <p className="mt-1 text-[14px] text-mut">Try clearing a filter or searching for something else.</p>
              <button onClick={clearAll} className="mt-4 text-[14px] font-semibold text-primary hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((lab, i) => (
                <LabCard key={lab.id} lab={lab} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-faint">{title}</h3>
      {children}
    </div>
  );
}

function FilterList({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; n: number }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="space-y-0.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(active ? null : o.value)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors",
              active ? "bg-primary/8 font-semibold text-primary" : "text-slate hover:bg-line2"
            )}
          >
            <span className="truncate pr-2">{o.label}</span>
            <span className={cn("text-[12px]", active ? "text-primary" : "text-faint")}>{o.n}</span>
          </button>
        );
      })}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
  accent,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex flex-none items-center gap-1.5 rounded-full border font-semibold transition-all",
        size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-2 text-[13px]",
        active
          ? "border-transparent text-white shadow-soft"
          : "border-line bg-surface text-slate hover:border-[#cdd2e2]"
      )}
      style={active ? { background: accent ?? "var(--color-primary)" } : undefined}
    >
      {children}
    </button>
  );
}
