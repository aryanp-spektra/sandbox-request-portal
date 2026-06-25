"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Cloud, ShieldCheck, Boxes } from "lucide-react";
import type { Lifecycle } from "@/lib/types";
import { LIFECYCLE } from "@/lib/state";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { Button } from "@/components/ui/Button";

type AreaCard = { name: string; count: number };
type Stats = {
  total: number;
  requestable: number;
  instant: number;
  solutionAreas: number;
  types: number;
};

const AREA_META: Record<string, { icon: typeof Sparkles; blurb: string }> = {
  "AI Business Solutions": {
    icon: Sparkles,
    blurb: "Copilot, Dynamics 365 and low-code labs that put AI to work across business functions.",
  },
  "Cloud & AI Platforms": {
    icon: Cloud,
    blurb: "Azure infrastructure, data and AI platform labs — from foundations to advanced architectures.",
  },
  Security: {
    icon: ShieldCheck,
    blurb: "Defender, Sentinel, Entra and Purview labs spanning the Microsoft security stack end to end.",
  },
};

const STATUS_ORDER: Lifecycle[] = ["Ready", "InUse", "Stale", "InTesting", "Retired"];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function Reveal({ i = 0, className, children }: { i?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      custom={i}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Hero({ stats, areas }: { stats: Stats; areas: AreaCard[] }) {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* soft brand wash, kept subtle */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 440px at 82% -8%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 60%), radial-gradient(680px 420px at 6% 4%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 58%)",
          }}
        />

        <div className="wrap py-24 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal i={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12.5px] font-semibold text-mut shadow-soft">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Microsoft Sandbox · FY27 Catalog
              </span>
            </Reveal>

            <Reveal i={1}>
              <h1 className="mt-7 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[54px] lg:text-[62px]">
                Every Microsoft lab,
                <br className="hidden sm:block" /> ready when <span className="aurora-text">you are</span>
              </h1>
            </Reveal>

            <Reveal i={2}>
              <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-mut sm:text-[17px]">
                A single, self-service catalog of guided labs, hackathons and sandboxes
                across AI, cloud and security — browse, compare, and request access in minutes.
              </p>
            </Reveal>

            <Reveal i={3}>
              <div className="mt-9 flex justify-center">
                <Button href="/explore" size="lg" className="w-full sm:w-auto">
                  Explore catalog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Stat band ────────────────────────────────────────────────────── */}
      <section className="wrap -mt-6 pb-4">
        <Reveal>
          <div className="grid grid-cols-2 divide-line rounded-[var(--radius-xl)] border border-line bg-surface shadow-card sm:grid-cols-4 sm:divide-x">
            {[
              { value: stats.total, label: "Labs in catalog" },
              { value: stats.instant, label: "Ready right now" },
              { value: stats.solutionAreas, label: "Solution areas" },
              { value: stats.types, label: "Lab formats" },
            ].map((s, idx) => (
              <div key={s.label} className={idx < 2 ? "border-b border-line sm:border-b-0" : ""}>
                <div className="px-6 py-7 text-center">
                  <div className="font-display text-[34px] font-extrabold tracking-tight text-ink">
                    <AnimatedNumber value={s.value} />
                  </div>
                  <div className="mt-1 text-[12.5px] font-medium text-mut">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Solution areas ───────────────────────────────────────────────── */}
      <section className="wrap py-20">
        <Reveal>
          <div className="mb-10 text-center">
            <h2 className="font-display text-[28px] font-extrabold tracking-tight text-ink sm:text-[34px]">
              Explore by solution area
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] text-mut">
              Three areas span the full Microsoft portfolio. Jump straight into the labs that fit your engagement.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {areas.map((area, i) => {
            const meta = AREA_META[area.name] ?? { icon: Boxes, blurb: "" };
            const Icon = meta.icon;
            return (
              <Reveal key={area.name} i={i}>
                <Link
                  href={`/explore?area=${encodeURIComponent(area.name)}`}
                  className="group flex h-full flex-col rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-line))] hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-line bg-canvas text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[12px] font-semibold text-faint">{area.count} labs</span>
                  </div>
                  <h3 className="mt-5 font-display text-[18px] font-bold tracking-tight text-ink">
                    {area.name}
                  </h3>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-mut">{meta.blurb}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                    Browse labs
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Status legend ────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface">
        <div className="wrap py-20">
          <Reveal>
            <div className="mb-10 max-w-xl">
              <h2 className="font-display text-[28px] font-extrabold tracking-tight text-ink sm:text-[34px]">
                What each status means
              </h2>
              <p className="mt-3 text-[15px] text-mut">
                Every lab carries a live status so you always know what to expect before you request it.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {STATUS_ORDER.map((state, i) => {
              const cfg = LIFECYCLE[state];
              return (
                <Reveal key={state} i={i}>
                  <div className="flex gap-4 border-t border-line pt-5">
                    <div className="w-[112px] shrink-0">
                      <LifecycleBadge state={state} />
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-mut">{cfg.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="wrap py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] deep px-8 py-14 text-center sm:px-12">
            <h2 className="relative font-display text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">
              Ready to dive into the catalog?
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-[15px] text-white/70">
              {stats.total} labs, filterable by area, level, product and format — with Excel and PDF export.
            </p>
            <div className="relative mt-8 flex justify-center">
              <Button href="/explore" size="lg">
                Explore catalog
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
