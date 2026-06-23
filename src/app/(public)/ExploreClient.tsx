"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, FileSpreadsheet, FileText, LayoutGrid, Sparkles, Check,
  ChevronDown, Wand2, ArrowUpRight, Boxes, History,
} from "lucide-react";
import { LABS, FACETS, lastUpdatedLabel } from "@/lib/labs";
import { TYPE_META, lifecycleConfig } from "@/lib/state";
import type { Lab, Lifecycle } from "@/lib/types";
import { PublicLabCard } from "@/components/PublicLabCard";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { exportExcel, exportPDF } from "@/lib/export";
import { cn } from "@/lib/cn";

type GroupBy = "none" | "solutionArea" | "skillArea" | "level" | "type";
type View = "catalog" | "whatsnew";
type SortKey = "default" | "az" | "newest" | "modules";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Recommended" },
  { key: "newest", label: "Recently updated" },
  { key: "az", label: "A to Z" },
  { key: "modules", label: "Most modules" },
];

const GROUPS: { key: GroupBy; label: string }[] = [
  { key: "none", label: "All labs" },
  { key: "solutionArea", label: "Workload" },
  { key: "skillArea", label: "Solution play" },
  { key: "level", label: "Level" },
  { key: "type", label: "Offering type" },
];

const STATUS_FILTERS: { key: Lifecycle | "all"; label: string }[] = [
  { key: "all", label: "Any status" },
  { key: "Ready", label: "Ready" },
  { key: "InUse", label: "In use" },
  { key: "Stale", label: "Needs validation" },
  { key: "InTesting", label: "Coming soon" },
  { key: "Retired", label: "Retired" },
];

export function ExploreClient() {
  const [view, setView] = useState<View>("catalog");
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState<Lifecycle | "all">("all");
  const [product, setProduct] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupBy>("none");
  const [sort, setSort] = useState<SortKey>("default");
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere (outside a field) to jump to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(el.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Most common products across the catalog, for the quick-filter chips.
  const popularProducts = useMemo(() => {
    const count = new Map<string, number>();
    for (const l of LABS) for (const p of l.products) count.set(p, (count.get(p) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([p]) => p);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = LABS.filter((l) => {
      if (area && l.solutionArea !== area) return false;
      if (skill && l.skillArea !== skill) return false;
      if (level && l.level !== level) return false;
      if (type && l.type !== type) return false;
      if (status !== "all" && l.lifecycle !== status) return false;
      if (product && !l.products.includes(product)) return false;
      if (s) {
        const hay = [l.title, l.hook, l.overview, l.skillArea, ...l.products].join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    const ts = (iso: string | null) => (iso ? new Date(iso).getTime() : Date.now() + 1e12);
    if (sort === "az") out.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "newest") out.sort((a, b) => ts(b.lastRefresh) - ts(a.lastRefresh));
    else if (sort === "modules") out.sort((a, b) => b.modules.length - a.modules.length);
    return out;
  }, [q, area, skill, level, type, status, product, sort]);

  const grouped = useMemo(() => {
    if (group === "none") return null;
    const m = new Map<string, Lab[]>();
    for (const l of filtered) {
      const key = (group === "type" ? l.typeLabel : (l[group] as string | null)) ?? "Unspecified";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(l);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered, group]);

  const activeChips = [
    area && { label: area, clear: () => setArea(null) },
    skill && { label: skill, clear: () => setSkill(null) },
    level && { label: level, clear: () => setLevel(null) },
    type && { label: TYPE_META[type as keyof typeof TYPE_META]?.label ?? type, clear: () => setType(null) },
    product && { label: product, clear: () => setProduct(null) },
    status !== "all" && { label: lifecycleConfig(status as Lifecycle).label, clear: () => setStatus("all") },
  ].filter(Boolean) as { label: string; clear: () => void }[];
  const activeFilters = activeChips.length;
  const clearAll = () => { setArea(null); setSkill(null); setLevel(null); setType(null); setStatus("all"); setProduct(null); setQ(""); };

  const runExport = async (kind: "xlsx" | "pdf") => {
    setBusy(kind);
    try {
      const label = activeFilters || q ? `${filtered.length} labs, filtered` : "Full catalog";
      if (kind === "xlsx") await exportExcel(filtered, label);
      else await exportPDF(filtered, label);
    } finally {
      setBusy(null);
    }
  };

  const changed = useMemo(
    () => LABS.filter((l) => l.enhancements || l.lifecycle === "InTesting" || l.catalogStatus.startsWith("Archive")),
    []
  );

  return (
    <main>
      {/* ── intro band ── */}
      <section className="border-b border-line bg-gradient-to-b from-[#f0f2fb] to-canvas dark:from-[#10162c]">
        <div className="wrap-wide pt-12 pb-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> FY27 catalog, refreshed for Build 2026
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-faint">
              <History className="h-3.5 w-3.5" />
              Last updated {lastUpdatedLabel()}
            </span>
          </div>
          <h1 className="mt-4 max-w-[760px] font-display text-[clamp(30px,4.5vw,46px)] font-extrabold leading-[1.08] tracking-tight text-ink">
            Explore the Microsoft Sandbox catalog
          </h1>
          <p className="mt-3 max-w-[620px] text-[16px] leading-relaxed text-mut">
            Every guided lab, hackathon and sandbox we offer, with what each one helps you build.
            Filter by level, workload or solution play, see what changed in the latest release, and
            take it with you as Excel or PDF.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-5">
            <Metric value={LABS.length} label="Total labs" />
            <Metric value={FACETS.solutionAreas.length} label="Workloads" />
            <Metric value={FACETS.skillAreas.length} label="Solution plays" />
            <Metric value={changed.length} label="Changed in Build 2026" />
          </div>
        </div>
      </section>

      <div className="wrap-wide py-7">
        {/* view toggle + export */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-[12px] border border-line bg-line2 p-1">
            <ViewTab active={view === "catalog"} onClick={() => setView("catalog")} icon={LayoutGrid}>Catalog</ViewTab>
            <ViewTab active={view === "whatsnew"} onClick={() => setView("whatsnew")} icon={Wand2}>What&apos;s new in Build 2026</ViewTab>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ExportBtn icon={FileSpreadsheet} label="Excel" loading={busy === "xlsx"} onClick={() => runExport("xlsx")} />
            <ExportBtn icon={FileText} label="PDF" loading={busy === "pdf"} onClick={() => runExport("pdf")} />
          </div>
        </div>

        {view === "catalog" ? (
          <>
            {/* search */}
            <div className="flex items-center gap-2 rounded-[13px] border border-line bg-surface px-4 shadow-soft focus-within:border-primary">
              <Search className="h-5 w-5 text-faint" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by technology, product, scenario or outcome…"
                className="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-faint"
              />
              <kbd className="hidden rounded-md border border-line bg-line2 px-1.5 py-0.5 text-[10px] font-semibold text-mut sm:block">/</kbd>
              {q && <button onClick={() => setQ("")} className="text-faint hover:text-ink"><X className="h-4 w-4" /></button>}
            </div>

            {/* popular technologies */}
            <div className="mb-4 mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-faint">Popular tech</span>
              {popularProducts.map((p) => (
                <button
                  key={p}
                  onClick={() => setProduct(product === p ? null : p)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-all",
                    product === p ? "border-transparent bg-primary text-white shadow-soft" : "border-line bg-surface text-slate hover:border-[#cdd2e2]"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* filters */}
            <div className="mb-5 grid gap-3 rounded-[16px] border border-line bg-surface p-4 shadow-soft md:grid-cols-2 xl:grid-cols-4">
              <Dropdown label="Workload" value={area} onChange={setArea} options={FACETS.solutionAreas} />
              <Dropdown label="Solution play" value={skill} onChange={setSkill} options={FACETS.skillAreas} />
              <Dropdown label="Level" value={level} onChange={setLevel} options={FACETS.levels} />
              <Dropdown label="Offering type" value={type} onChange={setType} options={FACETS.types.map((t) => t.id)} render={(id) => TYPE_META[id as keyof typeof TYPE_META]?.label ?? id} />
            </div>

            {/* status pills + group by */}
            <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-faint">Status</span>
                {STATUS_FILTERS.map((f) => (
                  <Chip key={f.key} active={status === f.key} onClick={() => setStatus(f.key as Lifecycle | "all")}>{f.label}</Chip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-faint">Group by</span>
                {GROUPS.map((g) => (
                  <Chip key={g.key} active={group === g.key} onClick={() => setGroup(g.key)}>{g.label}</Chip>
                ))}
              </div>
            </div>

            {/* active filter chips */}
            {activeChips.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {activeChips.map((c) => (
                  <button
                    key={c.label}
                    onClick={c.clear}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    {c.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            {/* results header */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-[14px] text-mut"><b className="text-ink">{filtered.length}</b> {filtered.length === 1 ? "lab" : "labs"}</span>
              {(activeFilters > 0 || q) && (
                <button onClick={clearAll} className="text-[13px] font-semibold text-primary hover:underline">Clear all</button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[12.5px] text-faint">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-slate outline-none hover:border-[#cdd2e2] focus:border-primary"
                >
                  {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <Empty onClear={clearAll} />
            ) : grouped ? (
              <div className="space-y-10">
                {grouped.map(([name, items]) => (
                  <section key={name}>
                    <div className="mb-3.5 flex items-center gap-3">
                      <h2 className="font-display text-[20px] font-extrabold text-ink">{name}</h2>
                      <span className="rounded-full bg-line2 px-2.5 py-0.5 text-[12px] font-bold text-slate">{items.length}</span>
                      <div className="h-px flex-1 bg-line" />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {items.map((lab, i) => <PublicLabCard key={lab.id} lab={lab} index={i} />)}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((lab, i) => <PublicLabCard key={lab.id} lab={lab} index={i} />)}
              </div>
            )}
          </>
        ) : (
          <WhatsNew labs={changed} />
        )}
      </div>
    </main>
  );
}

/* ── What's new in Build 2026 ── */
function WhatsNew({ labs }: { labs: Lab[] }) {
  const enhanced = labs.filter((l) => l.enhancements && !l.catalogStatus.startsWith("Archive"));
  const fresh = labs.filter((l) => l.lifecycle === "InTesting");
  const retiring = labs.filter((l) => l.catalogStatus.startsWith("Archive"));

  return (
    <div className="space-y-9">
      <div className="rounded-[16px] border border-line bg-gradient-to-br from-[#f5f3ff] to-surface p-6 dark:from-[#1a1638]">
        <h2 className="font-display text-[22px] font-extrabold text-ink">What changed for Build 2026</h2>
        <p className="mt-1.5 max-w-[640px] text-[14px] text-mut">
          A release-over-release view of the catalog. New tracks coming online, existing labs getting
          Build 2026 enhancements, and tracks being retired so you always know what is current.
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          <Metric value={fresh.length} label="New tracks" />
          <Metric value={enhanced.length} label="Enhanced labs" />
          <Metric value={retiring.length} label="Retiring" />
        </div>
      </div>

      <ChangeGroup title="New tracks" tone="InTesting" labs={fresh} field={(l) => l.hook} />
      <ChangeGroup title="Enhanced for Build 2026" tone="Ready" labs={enhanced} field={(l) => l.enhancements ?? ""} />
      <ChangeGroup title="Retiring from the catalog" tone="Retired" labs={retiring} field={() => "Being retired. Plan replacements before it is removed."} />
    </div>
  );
}

function ChangeGroup({ title, tone, labs, field }: { title: string; tone: Lifecycle; labs: Lab[]; field: (l: Lab) => string }) {
  if (labs.length === 0) return null;
  return (
    <section>
      <div className="mb-3.5 flex items-center gap-3">
        <LifecycleBadge state={tone} />
        <h3 className="font-display text-[19px] font-bold text-ink">{title}</h3>
        <span className="rounded-full bg-line2 px-2.5 py-0.5 text-[12px] font-bold text-slate">{labs.length}</span>
        <div className="h-px flex-1 bg-line" />
      </div>
      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        {labs.map((l, i) => (
          <Link key={l.id} href={`/labs/${l.id}`} className={cn("group flex items-start gap-4 p-4 transition-colors hover:bg-line2/50", i > 0 && "border-t border-line2")}>
            <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${TYPE_META[l.type].accent}, ${TYPE_META[l.type].accent2})` }}>
              <Boxes className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14.5px] font-bold text-ink group-hover:text-primary">{l.title}</span>
                <span className="flex-none text-[11px] font-semibold text-faint">{l.typeLabel}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-mut">{field(l)}</p>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 flex-none text-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── small UI ── */
function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display text-[28px] font-extrabold leading-none text-ink"><AnimatedNumber value={value} /></div>
      <div className="mt-1 text-[12.5px] font-medium text-faint">{label}</div>
    </div>
  );
}

function ViewTab({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof LayoutGrid; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 rounded-[9px] px-4 py-2 text-[13.5px] font-semibold transition-all", active ? "bg-surface text-ink shadow-soft" : "text-mut hover:text-ink")}>
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function ExportBtn({ icon: Icon, label, loading, onClick }: { icon: typeof FileText; label: string; loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} className="inline-flex items-center gap-2 rounded-[11px] border border-line bg-surface px-3.5 py-2.5 text-[13.5px] font-semibold text-slate shadow-soft transition-all hover:border-[#cdd2e2] hover:text-ink disabled:opacity-60">
      <Icon className="h-4 w-4 text-primary" />
      {loading ? "Preparing…" : `Export ${label}`}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-all", active ? "border-transparent aurora-fill text-white shadow-soft" : "border-line bg-surface text-slate hover:border-[#cdd2e2]")}>
      {children}
    </button>
  );
}

function Dropdown({ label, value, onChange, options, render }: { label: string; value: string | null; onChange: (v: string | null) => void; options: string[]; render?: (v: string) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-faint">{label}</span>
      <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)} className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink transition-colors hover:border-[#cdd2e2]">
        <span className={cn("truncate", !value && "text-faint font-medium")}>{value ? (render ? render(value) : value) : `Any ${label.toLowerCase()}`}</span>
        <ChevronDown className={cn("h-4 w-4 flex-none text-faint transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.14 }}
            className="absolute z-30 mt-1.5 max-h-[280px] w-full overflow-y-auto rounded-[12px] border border-line bg-surface p-1.5 shadow-[var(--shadow-lift)]"
          >
            <Option label={`Any ${label.toLowerCase()}`} active={!value} onClick={() => { onChange(null); setOpen(false); }} />
            {options.map((o) => (
              <Option key={o} label={render ? render(o) : o} active={value === o} onClick={() => { onChange(o); setOpen(false); }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Option({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onMouseDown={onClick} className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors", active ? "bg-primary/8 font-semibold text-primary" : "text-slate hover:bg-line2")}>
      <span className="truncate">{label}</span>
      {active && <Check className="h-4 w-4 flex-none" />}
    </button>
  );
}

function Empty({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-[18px] border border-dashed border-line bg-surface py-20 text-center">
      <p className="font-display text-[18px] font-bold text-ink">No labs match your filters</p>
      <p className="mt-1 text-[14px] text-mut">Try widening your search or clearing a filter.</p>
      <button onClick={onClear} className="mt-4 text-[14px] font-semibold text-primary hover:underline">Clear all filters</button>
    </div>
  );
}
