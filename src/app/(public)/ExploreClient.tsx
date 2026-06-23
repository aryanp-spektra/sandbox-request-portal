"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, FileSpreadsheet, FileText, LayoutGrid, Sparkles, Check,
  ChevronDown, Wand2, ArrowUpRight, Boxes, History, Shuffle, ArrowRight,
  Rows3, Grid3x3, GitCompare, Clock,
} from "lucide-react";
import { LABS, FACETS, lastUpdatedLabel, crosswalk, getLab } from "@/lib/labs";
import { TYPE_META, lifecycleConfig } from "@/lib/state";
import type { Lab, Lifecycle } from "@/lib/types";
import { PublicLabCard } from "@/components/PublicLabCard";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { exportExcel, exportPDF } from "@/lib/export";
import { getRecent } from "@/lib/recent";
import { cn } from "@/lib/cn";

type GroupBy = "none" | "area" | "play" | "level" | "type";
type View = "catalog" | "mapping" | "whatsnew";
type SortKey = "default" | "az" | "newest" | "modules";
type Fy = "FY27" | "FY26";
type Density = "comfortable" | "compact";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Recommended" },
  { key: "newest", label: "Recently updated" },
  { key: "az", label: "A to Z" },
  { key: "modules", label: "Most modules" },
];

const GROUPS: { key: GroupBy; label: string }[] = [
  { key: "none", label: "All labs" },
  { key: "area", label: "Solution area" },
  { key: "play", label: "Solution play" },
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

// Light synonym expansion so partner shorthand finds the right labs.
const SYNONYMS: Record<string, string[]> = {
  aks: ["azure kubernetes service", "kubernetes"],
  k8s: ["kubernetes", "azure kubernetes service"],
  gpt: ["openai", "azure openai"],
  llm: ["openai", "generative ai", "language model"],
  vm: ["virtual machine"],
  ml: ["machine learning"],
  iac: ["bicep", "terraform", "infrastructure as code"],
  cicd: ["devops", "pipeline", "github actions"],
  rag: ["retrieval augmented generation", "ai search"],
  soc: ["sentinel", "security operations", "defender"],
  bi: ["power bi", "analytics"],
};

const MAX_COMPARE = 4;

export function ExploreClient() {
  const [view, setView] = useState<View>("catalog");
  const [fy, setFy] = useState<Fy>("FY27");
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [play, setPlay] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState<Lifecycle | "all">("all");
  const [product, setProduct] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupBy>("none");
  const [sort, setSort] = useState<SortKey>("default");
  const [density, setDensity] = useState<Density>("comfortable");
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const [recent, setRecent] = useState<Lab[]>([]);
  const [ready, setReady] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const areaOf = useCallback((l: Lab) => (fy === "FY26" ? l.fy26Area : l.fy27Area), [fy]);
  const playOf = useCallback((l: Lab) => (fy === "FY26" ? l.fy26Play : l.fy27Play), [fy]);
  const areaOptions = fy === "FY26" ? FACETS.fy26Areas : FACETS.fy27Areas;
  const playOptions = fy === "FY26" ? FACETS.fy26Plays : FACETS.fy27Plays;

  // ── hydrate state from the URL + localStorage once, then keep the URL in sync ──
  // This reads external systems (the address bar and localStorage) a single time
  // after mount; the page is statically rendered so these values aren't known at
  // build time. setState-in-effect is the correct pattern here, hence the disable.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const get = (k: string) => p.get(k) || null;
    if (get("view")) setView(get("view") as View);
    if (get("fy") === "FY26") setFy("FY26");
    if (get("q")) setQ(get("q")!);
    setArea(get("area"));
    setPlay(get("play"));
    setLevel(get("level"));
    setType(get("type"));
    setProduct(get("product"));
    if (get("status")) setStatus(get("status") as Lifecycle);
    if (get("group")) setGroup(get("group") as GroupBy);
    if (get("sort")) setSort(get("sort") as SortKey);
    if (get("density") === "compact") setDensity("compact");
    setRecent(getRecent().map(getLab).filter(Boolean) as Lab[]);
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (view !== "catalog") p.set("view", view);
    if (fy !== "FY27") p.set("fy", fy);
    if (q) p.set("q", q);
    if (area) p.set("area", area);
    if (play) p.set("play", play);
    if (level) p.set("level", level);
    if (type) p.set("type", type);
    if (product) p.set("product", product);
    if (status !== "all") p.set("status", status);
    if (group !== "none") p.set("group", group);
    if (sort !== "default") p.set("sort", sort);
    if (density !== "comfortable") p.set("density", density);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ready, view, fy, q, area, play, level, type, product, status, group, sort, density]);

  // Press "/" or Cmd/Ctrl+K to jump to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = /input|textarea|select/i.test(el.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setView("catalog");
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
    const terms = s ? [s, ...(SYNONYMS[s.replace(/[^a-z0-9]/g, "")] ?? [])] : [];
    const out = LABS.filter((l) => {
      if (area && areaOf(l) !== area) return false;
      if (play && playOf(l) !== play) return false;
      if (level && l.level !== level) return false;
      if (type && l.type !== type) return false;
      if (status !== "all" && l.lifecycle !== status) return false;
      if (product && !l.products.includes(product)) return false;
      if (terms.length) {
        const hay = [l.title, l.fy27Title ?? "", l.hook, l.overview, l.skillArea ?? "", l.fy26Play ?? "", ...l.products].join(" ").toLowerCase();
        if (!terms.some((t) => hay.includes(t))) return false;
      }
      return true;
    });
    // Null refresh dates (brand-new tracks) sort as the newest.
    const ts = (iso: string | null) => (iso ? new Date(iso).getTime() : Infinity);
    if (sort === "az") out.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "newest") out.sort((a, b) => ts(b.lastRefresh) - ts(a.lastRefresh));
    else if (sort === "modules") out.sort((a, b) => b.modules.length - a.modules.length);
    return out;
  }, [q, area, play, level, type, status, product, sort, areaOf, playOf]);

  const grouped = useMemo(() => {
    if (group === "none") return null;
    const keyOf = (l: Lab) =>
      group === "type" ? l.typeLabel
      : group === "area" ? areaOf(l)
      : group === "play" ? playOf(l)
      : (l[group] as string | null);
    const m = new Map<string, Lab[]>();
    for (const l of filtered) {
      const key = keyOf(l) ?? "Unspecified";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(l);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered, group, areaOf, playOf]);

  const activeChips = [
    area && { label: area, clear: () => setArea(null) },
    play && { label: play, clear: () => setPlay(null) },
    level && { label: level, clear: () => setLevel(null) },
    type && { label: TYPE_META[type as keyof typeof TYPE_META]?.label ?? type, clear: () => setType(null) },
    product && { label: product, clear: () => setProduct(null) },
    status !== "all" && { label: lifecycleConfig(status as Lifecycle).label, clear: () => setStatus("all") },
  ].filter(Boolean) as { label: string; clear: () => void }[];
  const activeFilters = activeChips.length;
  const clearAll = () => { setArea(null); setPlay(null); setLevel(null); setType(null); setStatus("all"); setProduct(null); setQ(""); };

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

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_COMPARE ? [...c, id] : c));

  const changed = useMemo(
    () => LABS.filter((l) => l.enhancements || l.lifecycle === "InTesting" || l.catalogStatus.startsWith("Archive")),
    []
  );

  const gridCls = density === "compact"
    ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
    : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  const showRecent = view === "catalog" && activeFilters === 0 && !q && recent.length > 0;

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
          <p className="mt-3 max-w-[640px] text-[16px] leading-relaxed text-mut">
            Every guided lab, hackathon and sandbox we offer, mapped from FY26 to the FY27 solution
            plays. Filter by area, play, level or technology, see what changed for Build 2026, and
            take it with you as Excel or PDF.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-5">
            <Metric value={LABS.length} label="Total labs" />
            <Metric value={FACETS.fy27Areas.length} label="FY27 areas" />
            <Metric value={FACETS.fy27Plays.length} label="FY27 plays" />
            <Metric value={changed.length} label="Changed in Build 2026" />
          </div>
        </div>
      </section>

      <div className="wrap-wide py-7">
        {/* view toggle + export */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-[12px] border border-line bg-line2 p-1">
            <ViewTab active={view === "catalog"} onClick={() => setView("catalog")} icon={LayoutGrid}>Catalog</ViewTab>
            <ViewTab active={view === "mapping"} onClick={() => setView("mapping")} icon={Shuffle}>FY26 to FY27 map</ViewTab>
            <ViewTab active={view === "whatsnew"} onClick={() => setView("whatsnew")} icon={Wand2}>What&apos;s new</ViewTab>
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
                aria-label="Search the catalog by technology, product, scenario or outcome"
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

            {/* fiscal-year taxonomy toggle */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-faint">Solution taxonomy</span>
              <div className="inline-flex rounded-[10px] border border-line bg-line2 p-0.5">
                {(["FY27", "FY26"] as Fy[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFy(f); setArea(null); setPlay(null); }}
                    className={cn("rounded-[8px] px-3.5 py-1.5 text-[12.5px] font-bold transition-all", fy === f ? "bg-surface text-primary shadow-soft" : "text-mut hover:text-ink")}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-[12px] text-faint">Filter and group labs by the {fy} solution area and play.</span>
            </div>

            {/* filters */}
            <div className="mb-5 grid gap-3 rounded-[16px] border border-line bg-surface p-4 shadow-soft md:grid-cols-2 xl:grid-cols-4">
              <Dropdown label={`${fy} area`} value={area} onChange={setArea} options={areaOptions} />
              <Dropdown label={`${fy} play`} value={play} onChange={setPlay} options={playOptions} />
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

            {/* recently viewed */}
            {showRecent && (
              <section className="mb-7">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-faint" />
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-faint">Recently viewed</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.slice(0, 6).map((l) => (
                    <Link key={l.id} href={`/labs/${l.id}`} className="inline-flex max-w-[260px] items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-slate transition-all hover:border-primary hover:text-primary">
                      <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: TYPE_META[l.type].accent }} />
                      <span className="truncate">{l.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* results header */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-[14px] text-mut"><b className="text-ink">{filtered.length}</b> {filtered.length === 1 ? "lab" : "labs"}</span>
              {(activeFilters > 0 || q) && (
                <button onClick={clearAll} className="text-[13px] font-semibold text-primary hover:underline">Clear all</button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <DensityToggle density={density} setDensity={setDensity} />
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
                    <div className={gridCls}>
                      {items.map((lab, i) => (
                        <PublicLabCard key={lab.id} lab={lab} index={i} selectable selected={compare.includes(lab.id)} onToggleSelect={() => toggleCompare(lab.id)} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className={gridCls}>
                {filtered.map((lab, i) => (
                  <PublicLabCard key={lab.id} lab={lab} index={i} selectable selected={compare.includes(lab.id)} onToggleSelect={() => toggleCompare(lab.id)} />
                ))}
              </div>
            )}
          </>
        ) : view === "mapping" ? (
          <MappingView onPick={(p) => { setFy("FY27"); setArea(null); setPlay(p); setView("catalog"); }} />
        ) : (
          <WhatsNew labs={changed} />
        )}
      </div>

      {/* compare drawer + modal */}
      <CompareBar ids={compare} onClear={() => setCompare([])} onOpen={() => setCompareOpen(true)} onRemove={toggleCompare} />
      <AnimatePresence>
        {compareOpen && <CompareModal ids={compare} onClose={() => setCompareOpen(false)} onRemove={toggleCompare} />}
      </AnimatePresence>
    </main>
  );
}

/* ── FY26 to FY27 crosswalk view ── */
function MappingView({ onPick }: { onPick: (fy27Play: string) => void }) {
  const rows = useMemo(() => crosswalk(), []);
  const byArea = useMemo(() => {
    const m = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!m.has(r.fy26Area)) m.set(r.fy26Area, []);
      m.get(r.fy26Area)!.push(r);
    }
    return [...m.entries()];
  }, [rows]);

  return (
    <div className="space-y-9">
      <div className="rounded-[16px] border border-line bg-gradient-to-br from-[#f5f3ff] to-surface p-6 dark:from-[#1a1638]">
        <h2 className="font-display text-[22px] font-extrabold text-ink">FY26 to FY27 solution mapping</h2>
        <p className="mt-1.5 max-w-[680px] text-[14px] text-mut">
          How each FY26 solution play maps to the FY27 taxonomy. If you know a lab by its FY26 play,
          this shows where it landed for FY27 and how many labs made each move.
        </p>
      </div>

      {byArea.map(([fy26Area, items]) => (
        <section key={fy26Area}>
          <div className="mb-3.5 flex items-center gap-3">
            <h3 className="font-display text-[19px] font-bold text-ink">{fy26Area}</h3>
            <span className="rounded-full bg-line2 px-2.5 py-0.5 text-[12px] font-bold text-slate">{items.length} mappings</span>
            <div className="h-px flex-1 bg-line" />
          </div>
          <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
            {items.map((r, i) => (
              <button
                key={`${r.fy26Play}-${r.fy27Play}`}
                onClick={() => onPick(r.fy27Play)}
                className={cn("group grid w-full grid-cols-[1fr_auto_1fr_auto] items-center gap-4 p-4 text-left transition-colors hover:bg-line2/50", i > 0 && "border-t border-line2")}
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-faint">FY26</span>
                  <p className="truncate text-[14px] font-semibold text-slate">{r.fy26Play}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-none text-primary" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">FY27 · {r.fy27Area}</span>
                  <p className="truncate text-[14.5px] font-bold text-ink group-hover:text-primary">{r.fy27Play}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-line2 px-2.5 py-1 text-[12px] font-bold text-slate">
                  {r.count} {r.count === 1 ? "lab" : "labs"}
                  <ArrowUpRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ── compare ── */
function CompareBar({ ids, onClear, onOpen, onRemove }: { ids: string[]; onClear: () => void; onOpen: () => void; onRemove: (id: string) => void }) {
  return (
    <AnimatePresence>
      {ids.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
        >
          <div className="wrap-wide flex items-center gap-3 py-3">
            <GitCompare className="h-5 w-5 flex-none text-primary" />
            <span className="flex-none text-[13px] font-bold text-ink">Compare {ids.length}</span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {ids.map((id) => {
                const l = getLab(id);
                if (!l) return null;
                return (
                  <span key={id} className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full bg-line2 px-2.5 py-1 text-[12px] font-semibold text-slate">
                    <span className="truncate">{l.title}</span>
                    <button onClick={() => onRemove(id)} className="text-faint hover:text-ink"><X className="h-3 w-3" /></button>
                  </span>
                );
              })}
            </div>
            <button onClick={onClear} className="flex-none text-[13px] font-semibold text-faint hover:text-ink">Clear</button>
            <button
              onClick={onOpen}
              disabled={ids.length < 2}
              className="flex-none rounded-[11px] aurora-fill px-4 py-2 text-[13.5px] font-bold text-white shadow-soft transition-all hover:brightness-105 disabled:opacity-50"
            >
              Compare
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CompareRow {
  label: string;
  /** stable string used to detect whether labs differ on this attribute */
  key: (l: Lab) => string;
  /** cell content (defaults to key()) */
  render?: (l: Lab) => React.ReactNode;
}

function CompareModal({ ids, onClose, onRemove }: { ids: string[]; onClose: () => void; onRemove: (id: string) => void }) {
  const labs = ids.map(getLab).filter(Boolean) as Lab[];
  const rows: CompareRow[] = [
    { label: "Value", key: (l) => l.hook },
    { label: "Offering", key: (l) => l.typeLabel },
    { label: "FY26 area", key: (l) => l.fy26Area ?? "New for FY27" },
    { label: "FY26 play", key: (l) => l.fy26Play ?? "New for FY27" },
    { label: "FY27 area", key: (l) => l.fy27Area },
    { label: "FY27 play", key: (l) => l.fy27Play ?? "Unspecified" },
    { label: "Level", key: (l) => l.level ?? "All levels" },
    { label: "Delivery", key: (l) => l.style ?? "—" },
    { label: "Access", key: (l) => (l.durationHours ? `${l.durationHours}h` : "—") },
    { label: "Status", key: (l) => lifecycleConfig(l.lifecycle).label },
    {
      label: "Products",
      key: (l) => l.products.join(","),
      render: (l) =>
        l.products.length ? (
          <div className="flex flex-wrap gap-1">
            {l.products.slice(0, 6).map((p) => (
              <span key={p} className="rounded-md bg-line2 px-1.5 py-0.5 text-[11px] font-medium text-slate">{p}</span>
            ))}
            {l.products.length > 6 && <span className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[11px] font-semibold text-primary">+{l.products.length - 6}</span>}
          </div>
        ) : "—",
    },
    {
      label: `Modules`,
      key: (l) => String(l.modules.length),
      render: (l) => (
        <div>
          <span className="text-[12px] font-bold text-ink">{l.modules.length} modules</span>
          {l.modules.length > 0 && (
            <ol className="mt-1 space-y-0.5">
              {l.modules.slice(0, 3).map((m, i) => (
                <li key={i} className="flex gap-1.5 text-[11.5px] leading-snug text-mut"><span className="text-faint">{i + 1}.</span><span className="line-clamp-1">{m}</span></li>
              ))}
              {l.modules.length > 3 && <li className="text-[11px] font-medium text-faint">+{l.modules.length - 3} more</li>}
            </ol>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.97, y: 8, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className="relative max-h-[86vh] w-full max-w-[960px] overflow-hidden rounded-[18px] border border-line bg-surface shadow-[var(--shadow-lift)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 font-display text-[17px] font-extrabold text-ink">
              <GitCompare className="h-5 w-5 text-primary" /> Compare labs
            </h3>
            <p className="mt-0.5 text-[12px] text-faint">Rows highlighted in amber are where these labs differ.</p>
          </div>
          <button onClick={onClose} className="text-faint hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[74vh] overflow-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr>
                <th className="w-[130px] border-b border-line p-3 text-left text-[11px] font-bold uppercase tracking-wider text-faint">Attribute</th>
                {labs.map((l) => (
                  <th key={l.id} className="min-w-[190px] border-b border-line p-3 text-left align-top">
                    <span className="block text-[10px] font-bold uppercase tracking-wide" style={{ color: TYPE_META[l.type].accent }}>{l.typeLabel}</span>
                    <Link href={`/labs/${l.id}`} className="mt-0.5 block text-[13.5px] font-bold leading-snug text-ink hover:text-primary">{l.title}</Link>
                    <button onClick={() => onRemove(l.id)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-faint hover:text-ink">
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const differs = labs.length > 1 && new Set(labs.map(r.key)).size > 1;
                return (
                  <tr key={r.label} className={cn(differs ? "bg-amber-400/[0.07]" : "even:bg-line2/30")}>
                    <td className="p-3 align-top">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-faint">
                        {r.label}
                        {differs && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Differs across these labs" />}
                      </span>
                    </td>
                    {labs.map((l) => (
                      <td key={l.id} className="p-3 align-top font-medium text-slate">{r.render ? r.render(l) : r.key(l)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DensityToggle({ density, setDensity }: { density: Density; setDensity: (d: Density) => void }) {
  return (
    <div className="hidden items-center rounded-[10px] border border-line bg-surface p-0.5 sm:inline-flex">
      <button
        onClick={() => setDensity("comfortable")}
        aria-label="Comfortable density"
        className={cn("grid h-7 w-7 place-items-center rounded-[7px] transition-colors", density === "comfortable" ? "bg-line2 text-primary" : "text-faint hover:text-ink")}
      >
        <Rows3 className="h-4 w-4" />
      </button>
      <button
        onClick={() => setDensity("compact")}
        aria-label="Compact density"
        className={cn("grid h-7 w-7 place-items-center rounded-[7px] transition-colors", density === "compact" ? "bg-line2 text-primary" : "text-faint hover:text-ink")}
      >
        <Grid3x3 className="h-4 w-4" />
      </button>
    </div>
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
      <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)} aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${value ?? `any ${label.toLowerCase()}`}`} className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink transition-colors hover:border-[#cdd2e2]">
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
