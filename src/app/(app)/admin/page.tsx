"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck, Clock, Zap, Gauge, TicketCheck, AlertTriangle, ArrowUpRight,
  CheckCircle2, Users, Sparkles, X, RotateCcw,
} from "lucide-react";
import { LABS } from "@/lib/labs";
import { usePortal, withOverride } from "@/lib/store";
import type { Lab, Lifecycle } from "@/lib/types";
import { TYPE_META } from "@/lib/state";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { Countdown } from "@/components/ui/Countdown";
import { Button } from "@/components/ui/Button";

const LANES: Lifecycle[] = ["Ready", "InUse", "Stale", "InTesting", "Retired"];

export default function AdminPage() {
  const requests = usePortal((s) => s.requests);
  const overrides = usePortal((s) => s.lifecycleOverrides);
  const setLifecycle = usePortal((s) => s.setLifecycle);
  const resetDemo = usePortal((s) => s.resetDemo);
  const [toast, setToast] = useState<string | null>(null);

  const labs = useMemo(() => LABS.map((l) => withOverride(l, overrides)), [overrides]);

  const held = requests.filter((r) => r.status === "held");
  const instantReady = labs.filter((l) => l.lifecycle === "Ready" || l.lifecycle === "InUse").length;
  const totalIssued = labs.reduce((n, l) => n + l.vouchers.issued, 0);
  const totalRedeemed = labs.reduce((n, l) => n + l.vouchers.redeemed, 0);
  const burn = totalIssued ? Math.round((totalRedeemed / totalIssued) * 100) : 0;
  // Live SLA metric: needs the real current time, so it recomputes each render.
  // eslint-disable-next-line react-hooks/purity
  const atRisk = held.filter((r) => r.slaDueAt && new Date(r.slaDueAt).getTime() - Date.now() < 24 * 3.6e6).length;

  const byLane = useMemo(() => {
    const m = Object.fromEntries(LANES.map((l) => [l, [] as Lab[]])) as Record<Lifecycle, Lab[]>;
    for (const l of labs) m[l.lifecycle].push(l);
    return m;
  }, [labs]);

  const demand = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of requests) {
      const lab = LABS.find((l) => l.id === r.labId);
      if (lab) m.set(lab.solutionArea, (m.get(lab.solutionArea) ?? 0) + r.quantity);
    }
    const max = Math.max(1, ...m.values());
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k, v, pct: (v / max) * 100 }));
  }, [requests]);

  const markReady = async (lab: Lab) => {
    const heldForLab = requests.filter((r) => r.labId === lab.id && r.status === "held").length;
    await setLifecycle(lab.id, "Ready");
    setToast(
      heldForLab
        ? `“${lab.title}” marked Ready, ${heldForLab} held request${heldForLab > 1 ? "s" : ""} auto-fulfilled.`
        : `“${lab.title}” marked Ready.`
    );
    setTimeout(() => setToast(null), 4500);
  };

  return (
    <main className="wrap-wide py-9">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-4 w-4" /> Sandbox team
          </div>
          <h1 className="mt-1 font-display text-[34px] font-extrabold tracking-tight text-ink">Operations cockpit</h1>
        </div>
        <button onClick={() => { resetDemo(); setToast("Demo data reset."); setTimeout(() => setToast(null), 2500); }} className="flex items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-mut hover:text-ink">
          <RotateCcw className="h-3.5 w-3.5" /> Reset demo
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi icon={Clock} c="var(--color-held)" bg="var(--st-held-bg)" v={held.length} label="Held requests" sub="awaiting validation" />
        <Kpi icon={AlertTriangle} c="#b91c1c" bg="#fef2f2" v={atRisk} label="SLA at risk" sub="< 24h remaining" />
        <Kpi icon={Zap} c="var(--color-ready)" bg="var(--st-ready-bg)" v={instantReady} label="Instant-ready" sub="labs issuing now" />
        <Kpi icon={TicketCheck} c="var(--color-inuse)" bg="var(--st-inuse-bg)" v={`${burn}%`} label="Voucher burn" sub={`${totalRedeemed.toLocaleString()} redeemed`} />
        <Kpi icon={Gauge} c="var(--color-testing)" bg="var(--st-testing-bg)" v={labs.length} label="Total labs" sub="in catalogue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* held queue */}
        <section className="rounded-[18px] border border-line bg-surface shadow-soft">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-[17px] font-bold text-ink">Held request queue</h2>
            <span className="rounded-md bg-held/10 px-2 py-0.5 text-[12px] font-bold text-held">{held.length} to validate</span>
          </div>
          <div className="divide-y divide-line2">
            {held.length === 0 && (
              <div className="px-5 py-12 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-ready" />
                <p className="mt-2 text-[14px] font-semibold text-ink">Queue is clear</p>
                <p className="text-[13px] text-mut">No requests waiting on validation.</p>
              </div>
            )}
            {held.map((r) => {
              const lab = labs.find((l) => l.id === r.labId);
              return (
                <div key={r.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-faint">{r.id}</span>
                        {r.slaDueAt && <Countdown to={r.slaDueAt} />}
                      </div>
                      <Link href={`/catalog/${r.labId}`} className="mt-1 block truncate text-[14.5px] font-bold text-ink hover:text-primary">{r.labTitle}</Link>
                      <p className="mt-0.5 text-[12.5px] text-mut">
                        {r.requesterName} · {r.quantity} vouchers
                        {r.customerName && <> · for <span className="font-semibold text-slate">{r.customerName}</span></>}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => lab && markReady(lab)}>
                      <CheckCircle2 className="h-4 w-4" /> Validate & mark Ready
                    </Button>
                  </div>

                  {lab && (
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 rounded-[12px] bg-line2/50 px-3.5 py-2.5 text-[12px] text-slate">
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-faint" /> Active for {lab.activePartners.join(", ") || "none"}</span>
                      <span className="flex items-center gap-1.5"><TicketCheck className="h-3.5 w-3.5 text-faint" /> {lab.vouchers.redeemed.toLocaleString()} redeemed</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* analytics */}
        <section className="space-y-6">
          <div className="rounded-[18px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-display text-[16px] font-bold text-ink"><Sparkles className="h-4 w-4 text-primary" /> Demand by solution area</h2>
            {demand.length === 0 ? <p className="text-[13px] text-faint">No requests yet.</p> : (
              <div className="space-y-3">
                {demand.map((d) => (
                  <div key={d.k}>
                    <div className="mb-1 flex justify-between text-[12.5px]"><span className="font-medium text-slate">{d.k}</span><span className="font-bold text-ink">{d.v}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-line2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className="h-full rounded-full aurora-fill" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[18px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-3 font-display text-[16px] font-bold text-ink">Voucher economics</h2>
            <div className="flex items-end gap-6">
              <div><div className="font-display text-[30px] font-extrabold text-ink">{totalRedeemed.toLocaleString()}</div><div className="text-[12px] text-faint">redeemed</div></div>
              <div><div className="font-display text-[30px] font-extrabold text-faint">{totalIssued.toLocaleString()}</div><div className="text-[12px] text-faint">issued</div></div>
              <div className="ml-auto text-right"><div className="font-display text-[30px] font-extrabold text-primary">{burn}%</div><div className="text-[12px] text-faint">burn rate</div></div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line2">
              <div className="h-full rounded-full aurora-fill" style={{ width: `${burn}%` }} />
            </div>
          </div>
        </section>
      </div>

      {/* ── LAB READINESS MATRIX ── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight text-ink">Lab readiness matrix</h2>
          <span className="text-[13px] text-mut">The whole catalogue, by lifecycle, flip a held lab to Ready to auto-release its queue.</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {LANES.map((lane) => {
            const items = byLane[lane];
            return (
              <div key={lane} className="flex flex-col rounded-[16px] border border-line bg-canvas/60">
                <div className="flex items-center justify-between px-3.5 py-3">
                  <LifecycleBadge state={lane} size="sm" />
                  <span className="text-[13px] font-bold text-slate">{items.length}</span>
                </div>
                <div className="no-scrollbar max-h-[440px] space-y-2 overflow-y-auto px-2.5 pb-3">
                  {items.slice(0, 40).map((lab) => (
                    <LaneCard key={lab.id} lab={lab} canPromote={lane === "Stale"} onPromote={() => markReady(lab)} />
                  ))}
                  {items.length > 40 && <p className="px-2 py-2 text-center text-[12px] text-faint">+{items.length - 40} more</p>}
                  {items.length === 0 && <p className="px-2 py-6 text-center text-[12px] text-faint">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-[120] flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-[14px] border border-line bg-ink px-4 py-3 text-[13.5px] font-medium text-white shadow-[var(--shadow-lift)]"
          >
            <CheckCircle2 className="h-5 w-5 flex-none text-emerald-400" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-1 text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Kpi({ icon: Icon, c, bg, v, label, sub }: { icon: typeof Clock; c: string; bg: string; v: number | string; label: string; sub: string }) {
  return (
    <div className="rounded-[16px] border border-line bg-surface p-4 shadow-soft">
      <span className="grid h-9 w-9 place-items-center rounded-[10px]" style={{ background: bg }}>
        <Icon className="h-[18px] w-[18px]" style={{ color: c }} />
      </span>
      <div className="mt-3 font-display text-[26px] font-extrabold leading-none text-ink">{v}</div>
      <div className="mt-1.5 text-[13px] font-semibold text-ink">{label}</div>
      <div className="text-[12px] text-faint">{sub}</div>
    </div>
  );
}

function LaneCard({ lab, canPromote, onPromote }: { lab: Lab; canPromote: boolean; onPromote: () => void }) {
  const meta = TYPE_META[lab.type];
  return (
    <div className="rounded-[11px] border border-line bg-surface p-2.5 shadow-soft">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 h-2 w-2 flex-none rounded-full" style={{ background: meta.accent }} />
        <Link href={`/catalog/${lab.id}`} className="line-clamp-2 flex-1 text-[12.5px] font-semibold leading-snug text-ink hover:text-primary">
          {lab.title}
        </Link>
      </div>
      <div className="mt-1.5 flex items-center justify-between pl-4">
        <span className="text-[11px] text-faint">{meta.label}</span>
        {canPromote && (
          <button onClick={onPromote} className="flex items-center gap-1 rounded-md bg-ready/10 px-1.5 py-0.5 text-[10.5px] font-bold text-ready hover:bg-ready/20">
            Ready <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
