"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Layers, RefreshCw, Ticket, Users, CheckCircle2, Zap, Clock, Ban,
  ChevronRight, Mail, Boxes, Sparkles,
} from "lucide-react";
import { LABS } from "@/lib/labs";
import { usePortal, withOverride } from "@/lib/store";
import { TYPE_META } from "@/lib/state";
import { evaluate } from "@/lib/rules";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { Button } from "@/components/ui/Button";
import { RequestModal } from "@/components/request/RequestModal";

function fmtDate(iso: string | null) {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function LabDetail({ id }: { id: string }) {
  const overrides = usePortal((s) => s.lifecycleOverrides);
  const base = LABS.find((l) => l.id === id)!;
  const lab = useMemo(() => withOverride(base, overrides), [base, overrides]);
  const [open, setOpen] = useState(false);

  const meta = TYPE_META[lab.type];
  const decision = evaluate(lab);

  const related = LABS.filter((l) => l.id !== lab.id && l.solutionArea === lab.solutionArea && l.requestable).slice(0, 3);

  return (
    <main>
      {/* header band */}
      <div className="deep relative overflow-hidden">
        <div className="wrap relative z-10 py-9">
          <Link href="/catalog" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to catalog
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-white backdrop-blur">
              <Layers className="h-3.5 w-3.5" /> {meta.label}
            </span>
            <LifecycleBadge state={lab.lifecycle} />
            {lab.isNew && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200 backdrop-blur">New</span>
            )}
          </div>

          <h1 className="mt-4 max-w-[820px] font-display text-[clamp(26px,4vw,42px)] font-extrabold leading-tight tracking-tight text-white">
            {lab.title}
          </h1>
          <p className="mt-3 flex items-start gap-2 text-[15px] font-medium leading-relaxed text-cyan-100/90">
            <Sparkles className="mt-1 h-4 w-4 flex-none" />
            {lab.hook}
          </p>
          <p className="mt-2 text-[13.5px] font-medium text-white/55">
            {lab.solutionArea}
            {lab.skillArea && <> · {lab.skillArea}</>}
            {lab.level && <> · {lab.level}</>}
          </p>
        </div>
      </div>

      <div className="wrap grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        {/* left: content */}
        <div className="min-w-0">
          <Section title="Overview">
            <p className="text-[15px] leading-relaxed text-slate">{lab.overview}</p>
          </Section>

          {lab.modules.length > 0 && (
            <Section title={`${lab.modules.length} modules`}>
              <ol className="space-y-0">
                {lab.modules.map((m, i) => (
                  <li key={i} className="flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line bg-surface text-[13px] font-bold text-primary">
                        {i + 1}
                      </span>
                      {i < lab.modules.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                    </div>
                    <span className="pt-1 text-[14.5px] font-medium leading-snug text-ink">{m}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {lab.products.length > 0 && (
            <Section title="Featured products & technologies">
              <div className="flex flex-wrap gap-2">
                {lab.products.map((p) => (
                  <span key={p} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-slate">
                    {p}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {lab.enhancements && (
            <Section title="Post-Build 2026 enhancements">
              <div className="rounded-[14px] border border-violet/20 bg-violet/5 p-4">
                <p className="text-[14px] leading-relaxed text-slate">{lab.enhancements}</p>
              </div>
            </Section>
          )}

          {related.length > 0 && (
            <Section title={`More in ${lab.solutionArea}`}>
              <div className="space-y-2">
                {related.map((r) => (
                  <Link key={r.id} href={`/catalog/${r.id}`} className="group flex items-center gap-3 rounded-[12px] border border-line bg-surface p-3 transition-all hover:border-[#cdd2e2] hover:shadow-soft">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg text-[11px] font-bold text-white" style={{ background: `linear-gradient(135deg,${TYPE_META[r.type].accent},${TYPE_META[r.type].accent2})` }}>
                      <Boxes className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">{r.title}</span>
                      <span className="text-[12px] text-faint">{TYPE_META[r.type].label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-faint transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* right: request panel */}
        <aside className="lg:relative">
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
              <OutcomeHeader outcome={decision.outcome} />

              <div className="p-5">
                <p className="text-[13.5px] leading-relaxed text-slate">
                  {decision.outcome === "instant"
                    ? "This lab is verified ready. Submit a request and the CloudLabs support team issues your vouchers and replies to you."
                    : decision.outcome === "held"
                    ? "This lab needs validation first. Your request is routed to the CloudLabs support and Sandbox teams before vouchers are issued."
                    : decision.message}
                </p>

                <dl className="mt-5 space-y-3.5">
                  <Stat icon={RefreshCw} label="Last refreshed" value={fmtDate(lab.lastRefresh)} />
                  <Stat icon={Ticket} label="Vouchers redeemed" value={`${lab.vouchers.redeemed.toLocaleString()} of ${lab.vouchers.issued.toLocaleString()} issued`} />
                  {lab.vouchers.lastRedeemed && (
                    <Stat icon={CheckCircle2} label="Last redeemed" value={fmtDate(lab.vouchers.lastRedeemed)} />
                  )}
                  {lab.activePartners.length > 0 && (
                    <Stat icon={Users} label="Active for" value={lab.activePartners.join(", ")} />
                  )}
                  {decision.sla && decision.outcome === "held" && (
                    <Stat icon={Clock} label="Response SLA" value={decision.sla.label} />
                  )}
                </dl>

                <div className="mt-5">
                  {lab.requestable ? (
                    <Button onClick={() => setOpen(true)} size="lg" className="w-full">
                      <Ticket className="h-4 w-4" /> Request a voucher
                    </Button>
                  ) : (
                    <Button size="lg" variant="subtle" className="w-full cursor-not-allowed opacity-70" disabled>
                      <Ban className="h-4 w-4" /> Not requestable
                    </Button>
                  )}
                  <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[12px] text-faint">
                    <Mail className="h-3.5 w-3.5" />
                    Routed to CloudLabs support for issuance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <RequestModal lab={lab} open={open} onClose={() => setOpen(false)} />
    </main>
  );
}

function OutcomeHeader({ outcome }: { outcome: "instant" | "held" | "blocked" }) {
  const map = {
    instant: { c: "var(--color-ready)", bg: "var(--st-ready-bg)", icon: Zap, t: "Ready to request" },
    held: { c: "var(--color-held)", bg: "var(--st-held-bg)", icon: Clock, t: "Needs validation" },
    blocked: { c: "var(--color-retired)", bg: "var(--st-retired-bg)", icon: Ban, t: "Not requestable" },
  }[outcome];
  const Icon = map.icon;
  return (
    <div className="flex items-center gap-2.5 px-5 py-4" style={{ background: map.bg }}>
      <Icon className="h-5 w-5" style={{ color: map.c }} />
      <span className="font-display text-[15px] font-bold" style={{ color: map.c }}>{map.t}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof RefreshCw; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-none text-faint" />
      <div className="min-w-0">
        <dt className="text-[12px] text-faint">{label}</dt>
        <dd className="text-[13.5px] font-semibold text-ink">{value}</dd>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="mb-3.5 font-display text-[19px] font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
