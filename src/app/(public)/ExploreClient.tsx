"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SearchIcon, XIcon, FileSpreadsheetIcon, FileTextIcon, SlidersHorizontalIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from "lucide-react";
import { LABS, FACETS, lastUpdatedLabel } from "@/lib/labs";
import { TYPE_META } from "@/lib/state";
import type { Lab, Lifecycle } from "@/lib/types";
import { LabCard } from "@/components/marketplace/LabCard";
import { RequestCustomLab } from "@/components/marketplace/RequestCustomLab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { exportExcel, exportPDF } from "@/lib/export";
import { cn } from "@/lib/utils";

type Fy = "FY27" | "FY26";
type SortKey = "default" | "az" | "modules" | "duration-asc" | "duration-desc";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Recommended" },
  { key: "az", label: "A to Z" },
  { key: "modules", label: "Most modules" },
  { key: "duration-asc", label: "Shortest first" },
  { key: "duration-desc", label: "Longest first" },
];

const STATUS_OPTIONS: { key: Lifecycle | "all"; label: string }[] = [
  { key: "all", label: "Any status" },
  { key: "Ready", label: "Ready" },
  { key: "InUse", label: "In use" },
  { key: "Stale", label: "Needs validation" },
  { key: "InTesting", label: "Coming soon" },
  { key: "Retired", label: "Retired" },
];

const ALL = "all";
const PAGE_SIZE = 12; // 4 rows of 3 on desktop, balances page length vs. count

export function ExploreClient() {
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [fy, setFy] = useState<Fy>("FY27");
  const [area, setArea] = useState<string | null>(null);
  const [play, setPlay] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState<Lifecycle | "all">("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  const areaOf = useCallback((l: Lab) => (fy === "FY26" ? l.fy26Area : l.fy27Area), [fy]);
  const playOf = useCallback((l: Lab) => (fy === "FY26" ? l.fy26Play : l.fy27Play), [fy]);
  const areaOptions = fy === "FY26" ? FACETS.fy26Areas : FACETS.fy27Areas;
  const playOptions = fy === "FY26" ? FACETS.fy26Plays : FACETS.fy27Plays;

  // hydrate from URL once
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const get = (k: string) => p.get(k) || null;
    if (get("fy") === "FY26") setFy("FY26");
    if (get("q")) setQ(get("q")!);
    setArea(get("area"));
    setPlay(get("play"));
    setLevel(get("level"));
    setType(get("type"));
    if (get("status")) setStatus(get("status") as Lifecycle);
    if (get("sort")) setSort(get("sort") as SortKey);
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // keep URL in sync
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (fy !== "FY27") p.set("fy", fy);
    if (q) p.set("q", q);
    if (area) p.set("area", area);
    if (play) p.set("play", play);
    if (level) p.set("level", level);
    if (type) p.set("type", type);
    if (status !== "all") p.set("status", status);
    if (sort !== "default") p.set("sort", sort);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ready, fy, q, area, play, level, type, status, sort]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = LABS.filter((l) => {
      if (area && areaOf(l) !== area) return false;
      if (play && playOf(l) !== play) return false;
      if (level && l.level !== level) return false;
      if (type && l.type !== type) return false;
      if (status !== "all" && l.lifecycle !== status) return false;
      if (s) {
        const hay = [l.title, l.hook, l.overview, l.skillArea ?? "", l.fy27Play ?? "", ...l.products]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "az":
          return a.title.localeCompare(b.title);
        case "modules":
          return b.modules.length - a.modules.length;
        case "duration-asc":
          return (a.durationHours ?? 1e9) - (b.durationHours ?? 1e9);
        case "duration-desc":
          return (b.durationHours ?? -1) - (a.durationHours ?? -1);
        default:
          return 0;
      }
    });
    return out;
  }, [q, area, play, level, type, status, sort, areaOf, playOf]);

  const activeCount = [area, play, level, type, status !== "all" ? status : null].filter(Boolean).length;
  const clearAll = () => {
    setArea(null); setPlay(null); setLevel(null); setType(null); setStatus("all"); setQ("");
  };

  // ── pagination ──────────────────────────────────────────────────────────
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const firstShown = filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(current * PAGE_SIZE, filtered.length);

  // Reset to the first page whenever the result set changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPage(1);
  }, [q, area, play, level, type, status, sort, fy]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runExport = async (kind: "xlsx" | "pdf") => {
    setBusy(kind);
    try {
      const label = activeCount || q ? `${filtered.length} labs, filtered` : "Full catalog";
      if (kind === "xlsx") await exportExcel(filtered, label);
      else await exportPDF(filtered, label);
    } finally {
      setBusy(null);
    }
  };

  // sentinel-aware Select helpers
  const sel = (v: string | null) => v ?? ALL;
  const onSel = (setter: (v: string | null) => void) => (v: string) => setter(v === ALL ? null : v);

  return (
    <main>
      {/* header band */}
      <section className="relative overflow-hidden border-b">
        <div aria-hidden className="hero-aura -z-10" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="font-bold text-3xl tracking-display sm:text-4xl">Explore the catalog</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
            Every guided lab, hackathon and sandbox, mapped from FY26 to the FY27 solution plays.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-muted-foreground text-xs">
            <Badge variant="secondary" className="font-medium">{LABS.length} labs</Badge>
            <span>Updated {lastUpdatedLabel()}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* search + export */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by technology, product, scenario or outcome…"
              className="h-10 pl-9"
              aria-label="Search the catalog"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" loading={busy === "xlsx"} onClick={() => runExport("xlsx")}>
              <FileSpreadsheetIcon className="size-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" loading={busy === "pdf"} onClick={() => runExport("pdf")}>
              <FileTextIcon className="size-4" /> PDF
            </Button>
          </div>
        </div>

        {/* filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
            <SlidersHorizontalIcon className="size-3.5" /> Filters
          </span>

          {/* FY toggle */}
          <div className="inline-flex rounded-md border bg-card p-0.5">
            {(["FY27", "FY26"] as Fy[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFy(f); setArea(null); setPlay(null); }}
                className={cn(
                  "rounded-[5px] px-2.5 py-1 font-semibold text-xs transition-colors",
                  fy === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <FilterSelect placeholder={`${fy} Solution Area`} value={sel(area)} onChange={onSel(setArea)} options={areaOptions} />
          <FilterSelect placeholder={`${fy} Solution Play`} value={sel(play)} onChange={onSel(setPlay)} options={playOptions} />
          <FilterSelect placeholder="Level" value={sel(level)} onChange={onSel(setLevel)} options={FACETS.levels} />
          <FilterSelect
            placeholder="Format"
            value={sel(type)}
            onChange={onSel(setType)}
            options={FACETS.types.map((t) => t.id)}
            render={(id) => TYPE_META[id as keyof typeof TYPE_META]?.label ?? id}
          />
          <Select value={status} onValueChange={(v) => setStatus(v as Lifecycle | "all")}>
            <SelectTrigger size="sm" className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
              <XIcon className="size-3.5" /> Clear
            </Button>
          )}
        </div>

        {/* result bar */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {filtered.length > 0 ? (
              <>
                Showing <span className="font-semibold text-foreground">{firstShown}–{lastShown}</span> of{" "}
                <span className="font-semibold text-foreground">{filtered.length}</span> labs
              </>
            ) : (
              <><span className="font-semibold text-foreground">0</span> labs</>
            )}
          </p>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger size="sm" className="h-8 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* grid */}
        {filtered.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border bg-card py-14 text-center">
            <p className="font-semibold">No labs match these filters.</p>
            <p className="max-w-sm text-muted-foreground text-sm">
              Adjust your filters, or tell us what you need and we&apos;ll scope a custom sandbox for you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={clearAll}>Clear filters</Button>
              <RequestCustomLab variant="default" size="sm" />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((l) => (
                <LabCard key={l.id} lab={l} />
              ))}
            </div>

            {pageCount > 1 && <Pager page={current} pageCount={pageCount} onChange={goToPage} />}

            {/* end-of-grid CTA, the canonical placement for "request a custom lab" */}
            <div className="relative mt-10 overflow-hidden rounded-2xl border bg-card px-6 py-8 shadow-md sm:px-10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(600px 220px at 100% 0%, color-mix(in srgb, var(--brand) 12%, transparent), transparent 70%)",
                }}
              />
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                  <h2 className="font-bold text-xl tracking-display">Can&apos;t find the lab you need?</h2>
                  <p className="mt-1 max-w-xl text-muted-foreground text-sm">
                    Tell us the topic, platform and audience, our Sandbox team will scope a custom lab for your engagement.
                  </p>
                </div>
                <RequestCustomLab variant="default" size="lg" className="shrink-0" />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function FilterSelect({
  placeholder, value, onChange, options, render,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  render?: (v: string) => string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="h-8">
        <SelectValue placeholder={placeholder}>
          {value === ALL ? placeholder : render ? render(value) : value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[320px]">
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{render ? render(o) : o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Compact page list with ellipses: 1 … 4 5 6 … 16 */
function pageRange(current: number, total: number): (number | "…")[] {
  const delta = 1;
  const pages: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) pages.push(i);
  }
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const i of pages) {
    if (prev) {
      if (i - prev === 2) out.push(prev + 1);
      else if (i - prev > 2) out.push("…");
    }
    out.push(i);
    prev = i;
  }
  return out;
}

function Pager({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (p: number) => void }) {
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="gap-1"
      >
        <ChevronLeftIcon className="size-4" /> Prev
      </Button>
      {pageRange(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-muted-foreground text-sm">…</span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "outline" : "ghost"}
            size="icon-sm"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={p === page ? "font-semibold" : "text-muted-foreground"}
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="gap-1"
      >
        Next <ChevronRightIcon className="size-4" />
      </Button>
    </nav>
  );
}
