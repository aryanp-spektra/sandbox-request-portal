"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SearchIcon, ArrowRightIcon, SparklesIcon, CloudIcon, ShieldCheckIcon,
  BoxesIcon, ZapIcon, LockIcon, LayoutGridIcon,
} from "lucide-react";
import type { Lifecycle } from "@/lib/types";
import { LIFECYCLE } from "@/lib/state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { cn } from "@/lib/utils";

type AreaCard = { name: string; count: number };
type Stats = { total: number; requestable: number; instant: number; solutionAreas: number; types: number };

const TRY_CHIPS = ["Azure", "Copilot", "OpenAI", "Security", "Fabric", "Power BI"];

const AREA_META: Record<string, { icon: typeof SparklesIcon; blurb: string }> = {
  "AI Business Solutions": {
    icon: SparklesIcon,
    blurb: "Copilot, Dynamics 365 and low-code labs that put AI to work across business functions.",
  },
  "Cloud & AI Platforms": {
    icon: CloudIcon,
    blurb: "Azure infrastructure, data and AI platform labs — from foundations to advanced architectures.",
  },
  Security: {
    icon: ShieldCheckIcon,
    blurb: "Defender, Sentinel, Entra and Purview labs spanning the Microsoft security stack end to end.",
  },
};

const STATUS_ORDER: Lifecycle[] = ["Ready", "InUse", "Stale", "InTesting", "Retired"];

export function StoreLanding({ stats, areas }: { stats: Stats; areas: AreaCard[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const search = (term?: string) => {
    const value = (term ?? q).trim();
    router.push(value ? `/explore?q=${encodeURIComponent(value)}` : "/explore");
  };

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 420px at 12% -10%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 60%), radial-gradient(720px 420px at 92% 0%, color-mix(in srgb, var(--brand) 10%, transparent), transparent 58%)",
          }}
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8 lg:py-20">
          {/* left: pitch + search */}
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-medium text-muted-foreground text-xs">
              <SparklesIcon className="size-3.5 text-primary" />
              FY27 Catalog · Build 2026 roadmap
            </span>
            <h1 className="mt-5 text-balance font-bold text-4xl leading-[1.05] tracking-display sm:text-5xl lg:text-6xl">
              Microsoft Sandbox <span className="text-primary">Store</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed sm:text-lg">
              Hands-on labs, hackathons and sandboxes across AI, cloud and security —
              everything you need to upskill teams and run customer engagements, fast.
            </p>

            {/* search */}
            <div className="mt-7 flex max-w-xl items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="Search labs, sandboxes, technologies…"
                  className="h-11 pl-9 text-sm"
                  aria-label="Search the catalog"
                />
              </div>
              <Button size="lg" className="h-11" onClick={() => search()}>
                Search
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>

            {/* try chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs">Try:</span>
              {TRY_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => search(c)}
                  className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* right: partner access panel */}
          <div className="animate-rise lg:pl-4">
            <div className="rounded-xl border bg-card p-6 shadow-md">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LockIcon className="size-4" />
                </span>
                Partner access
              </div>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                Sign in to request vouchers, track delivery SLAs, and manage your sandbox engagements.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {["Request vouchers in a click", "Track fulfillment & SLAs", "Save labs you're interested in"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 space-y-2">
                <Button asChild className="w-full">
                  <Link href="/portal">Open partner portal <ArrowRightIcon className="size-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
              <div className="mt-5 border-t pt-4">
                <p className="text-muted-foreground text-xs">Can&apos;t find the lab you need?</p>
                <Link
                  href="/explore"
                  className="mt-1 inline-flex items-center gap-1.5 font-medium text-primary text-sm hover:underline"
                >
                  <SparklesIcon className="size-3.5" /> Browse the full catalog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────────────────────── */}
      <section className="border-b bg-marketing-bg-subtle">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { value: stats.total, suffix: "", label: "Labs in the catalog" },
            { value: stats.instant, suffix: "", label: "Ready for instant access" },
            { value: stats.solutionAreas, suffix: "", label: "Solution areas" },
            { value: stats.types, suffix: "", label: "Lab formats" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-bold text-3xl tracking-display sm:text-4xl">
                {s.value.toLocaleString()}
                {s.suffix}
              </div>
              <div className="mt-1 text-muted-foreground text-xs uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Solution areas ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-display sm:text-3xl">Explore by solution area</h2>
            <p className="mt-2 max-w-lg text-muted-foreground text-sm">
              Three areas span the full Microsoft portfolio. Jump into the labs that fit your engagement.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden shrink-0 sm:inline-flex">
            <Link href="/explore">All labs <LayoutGridIcon className="size-4" /></Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {areas.map((area) => {
            const meta = AREA_META[area.name] ?? { icon: BoxesIcon, blurb: "" };
            const Icon = meta.icon;
            return (
              <Link
                key={area.name}
                href={`/explore?area=${encodeURIComponent(area.name)}`}
                className={cn(
                  "group flex h-full flex-col rounded-xl border bg-card p-6 shadow-md transition-all duration-200",
                  "hover:border-primary/40 hover:shadow-lg motion-safe:hover:-translate-y-0.5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl border bg-primary/5 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-muted-foreground text-xs">{area.count} labs</span>
                </div>
                <h3 className="mt-5 font-semibold text-lg">{area.name}</h3>
                <p className="mt-2 flex-1 text-muted-foreground text-sm leading-relaxed">{meta.blurb}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-medium text-primary text-sm">
                  Browse labs
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Status legend ────────────────────────────────────────────────── */}
      <section className="border-y bg-marketing-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-bold text-2xl tracking-display sm:text-3xl">What each status means</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Every lab carries a live status so you always know what to expect before you request it.
            </p>
          </div>
          <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {STATUS_ORDER.map((state) => (
              <div key={state} className="flex gap-4 border-t pt-5">
                <div className="w-[112px] shrink-0">
                  <LifecycleBadge state={state} />
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{LIFECYCLE[state].description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl border bg-primary px-8 py-12 text-center text-primary-foreground sm:px-12">
          <ZapIcon className="mx-auto size-7 opacity-90" />
          <h2 className="mt-4 font-bold text-2xl tracking-display sm:text-3xl">Ready to dive into the catalog?</h2>
          <p className="mx-auto mt-2 max-w-md text-primary-foreground/80 text-sm">
            {stats.total} labs, filterable by area, level, product and format — with Excel and PDF export.
          </p>
          <div className="mt-7 flex justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/explore">Explore catalog <ArrowRightIcon className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
