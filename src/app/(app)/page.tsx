import Link from "next/link";
import { Zap, Clock, Ban, ArrowRight, Sparkles, Boxes, ShieldCheck, Cpu } from "lucide-react";
import { catalogStats, featured, FACETS, LABS } from "@/lib/labs";
import { LabCard } from "@/components/LabCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { BrandLockupWhite } from "@/components/Brand";

const AREA_ICON: Record<string, typeof Cpu> = {
  "AI Business Solutions": Sparkles,
  "Cloud & AI Platforms": Cpu,
  Security: ShieldCheck,
};

const AREA_COUNT: Record<string, number> = LABS.reduce<Record<string, number>>((a, l) => {
  a[l.solutionArea] = (a[l.solutionArea] ?? 0) + 1;
  return a;
}, {});

export default function Home() {
  const stats = catalogStats();
  const labs = featured(6);

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="deep relative overflow-hidden">
        <div className="wrap relative z-10 pt-16 pb-40 text-center">
          <BrandLockupWhite height={40} className="mx-auto mb-9 opacity-95" />
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12.5px] font-semibold text-white/80 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
            </span>
            Microsoft Sandbox · Request Management Portal
          </div>

          <h1 className="mx-auto mt-7 max-w-[900px] font-display text-[clamp(36px,6vw,68px)] font-extrabold leading-[1.04] tracking-tight text-white">
            From a request to a voucher,
            <br />
            <span className="aurora-text">without the email thread.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[640px] text-[18px] leading-relaxed text-white/70">
            Browse the live sandbox catalog with every lab&apos;s real readiness state. Ready labs
            issue vouchers instantly, everything else is held, routed and tracked automatically.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="/catalog" size="lg" className="text-[15px]">
              Browse the catalog
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/admin" variant="outline" size="lg" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30">
              Sandbox team view
            </Button>
          </div>

          <Link href="/explore" className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-cyan-200 transition-colors hover:text-cyan-100">
            Open the public, read-only catalog to share with customers
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* floating stat bar */}
        <div className="wrap relative z-20 -mb-28">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line shadow-[var(--shadow-lift)] sm:grid-cols-4">
            {[
              { v: stats.total, l: "Labs in catalog", s: "across 6 offering types" },
              { v: stats.instant, l: "Issue instantly", s: "verified ready now" },
              { v: stats.requestable, l: "Requestable today", s: "ready or held" },
              { v: stats.solutionAreas, l: "Solution areas", s: "AI · Cloud · Security" },
            ].map((s) => (
              <div key={s.l} className="bg-surface px-6 py-6">
                <div className="font-display text-[34px] font-extrabold leading-none text-ink">
                  <AnimatedNumber value={s.v} />
                </div>
                <div className="mt-2 text-[13px] font-semibold text-ink">{s.l}</div>
                <div className="text-[12px] text-faint">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="wrap pt-44 pb-4">
        <div className="mb-10 text-center">
          <span className="text-[13px] font-bold uppercase tracking-wider text-primary">How fulfillment works</span>
          <h2 className="mt-2 font-display text-[32px] font-extrabold text-ink">Three paths, decided in real time</h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-mut">
            The portal reads each lab&apos;s live state and applies the Sandbox team&apos;s playbook
            automatically, so most requests never touch a human.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Zap, c: "var(--color-ready)", bg: "var(--st-ready-bg)", t: "Instant", d: "Lab is tested, refreshed and Ready. The voucher code generates immediately and appears in-app, supply it to the customer on the spot.", tag: "Ready · In Use" },
            { icon: Clock, c: "var(--color-held)", bg: "var(--st-held-bg)", t: "Held & routed", d: "Lab needs validation. The request is held, routed to the Sandbox team with full context, and vouchers release automatically once it's marked Ready, within the 3-day SLA.", tag: "Needs validation" },
            { icon: Ban, c: "var(--color-retired)", bg: "var(--st-retired-bg)", t: "Blocked", d: "Lab is retired or still being built. It stays visible for transparency but is clearly flagged and cannot be requested.", tag: "Retired · Coming soon" },
          ].map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.t} className="rounded-[18px] border border-line bg-surface p-6 shadow-soft transition-shadow hover:shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-[14px]" style={{ background: p.bg }}>
                  <Icon className="h-6 w-6" style={{ color: p.c }} />
                </span>
                <h3 className="mt-4 font-display text-[19px] font-bold text-ink">{p.t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-mut">{p.d}</p>
                <div className="mt-4 inline-flex rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ background: p.bg, color: p.c }}>
                  {p.tag}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SOLUTION AREAS ───────────────────────────────────────────────── */}
      <section className="wrap pt-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {FACETS.solutionAreas.map((area) => {
            const Icon = AREA_ICON[area] ?? Boxes;
            const n = AREA_COUNT[area] ?? 0;
            return (
              <Link
                key={area}
                href={`/catalog?area=${encodeURIComponent(area)}`}
                className="group flex items-center gap-4 rounded-[16px] border border-line bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <span className="grid h-12 w-12 flex-none place-items-center rounded-[13px] aurora-fill text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <div className="font-display text-[16px] font-bold text-ink">{area}</div>
                  <div className="text-[13px] text-faint">{n} labs</div>
                </div>
                <ArrowRight className="h-4 w-4 text-faint transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── FEATURED ─────────────────────────────────────────────────────── */}
      <section className="wrap pt-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span className="text-[13px] font-bold uppercase tracking-wider text-primary">Most redeemed</span>
            <h2 className="mt-1 font-display text-[28px] font-extrabold text-ink">Featured labs</h2>
          </div>
          <Button href="/catalog" variant="outline" size="sm">
            View all {stats.total}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab, i) => (
            <LabCard key={lab.id} lab={lab} index={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
