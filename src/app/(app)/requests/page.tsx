"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Ticket, Wallet, Zap, Clock, CheckCircle2, Ban, Copy, Check, ChevronDown, Inbox, ArrowRight,
} from "lucide-react";
import { usePortal } from "@/lib/store";
import type { SandboxRequest } from "@/lib/types";
import { Countdown } from "@/components/ui/Countdown";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const STATUS_META: Record<SandboxRequest["status"], { label: string; c: string; bg: string; icon: typeof Zap }> = {
  "instant-fulfilled": { label: "Fulfilled · instant", c: "var(--color-ready)", bg: "var(--st-ready-bg)", icon: Zap },
  fulfilled: { label: "Fulfilled", c: "var(--color-ready)", bg: "var(--st-ready-bg)", icon: CheckCircle2 },
  held: { label: "Held · validating", c: "var(--color-held)", bg: "var(--st-held-bg)", icon: Clock },
  "in-validation": { label: "In validation", c: "var(--color-held)", bg: "var(--st-held-bg)", icon: Clock },
  submitted: { label: "Submitted", c: "var(--color-inuse)", bg: "var(--st-inuse-bg)", icon: Inbox },
  blocked: { label: "Blocked", c: "var(--color-retired)", bg: "var(--st-retired-bg)", icon: Ban },
};

export default function RequestsPage() {
  const requests = usePortal((s) => s.requests);
  const [tab, setTab] = useState<"requests" | "wallet">("requests");

  const wallet = useMemo(
    () => requests.filter((r) => r.vouchers.length > 0),
    [requests]
  );
  const totalCodes = wallet.reduce((n, r) => n + r.vouchers.length, 0);
  const held = requests.filter((r) => r.status === "held").length;

  return (
    <main className="wrap py-9">
      <div className="mb-6">
        <h1 className="font-display text-[34px] font-extrabold tracking-tight text-ink">My requests</h1>
        <p className="mt-1 text-[15px] text-mut">
          Prashanti Tembhare · WaferWire LLC, {requests.length} requests, {totalCodes} vouchers
          {held > 0 && <> · <span className="font-semibold text-held">{held} held</span></>}
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-[12px] border border-line bg-line2 p-1">
        <Tab active={tab === "requests"} onClick={() => setTab("requests")} icon={Ticket}>Requests {requests.length}</Tab>
        <Tab active={tab === "wallet"} onClick={() => setTab("wallet")} icon={Wallet}>Voucher wallet {totalCodes}</Tab>
      </div>

      {tab === "requests" ? (
        requests.length === 0 ? <Empty /> : (
          <div className="space-y-3">
            {requests.map((r, i) => <RequestRow key={r.id} req={r} index={i} />)}
          </div>
        )
      ) : (
        wallet.length === 0 ? <Empty wallet /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {wallet.map((r) => <WalletCard key={r.id} req={r} />)}
          </div>
        )
      )}
    </main>
  );
}

function Tab({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Ticket; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 rounded-[9px] px-4 py-2 text-[13.5px] font-semibold transition-all", active ? "bg-surface text-ink shadow-soft" : "text-mut hover:text-ink")}>
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function RequestRow({ req, index }: { req: SandboxRequest; index: number }) {
  const [open, setOpen] = useState(false);
  const sm = STATUS_META[req.status];
  const Icon = sm.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-soft"
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-4 text-left">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-[12px]" style={{ background: sm.bg }}>
          <Icon className="h-5 w-5" style={{ color: sm.c }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-faint">{req.id}</span>
            <span className="rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide" style={{ background: sm.bg, color: sm.c }}>{sm.label}</span>
          </div>
          <div className="mt-0.5 truncate text-[14.5px] font-semibold text-ink">{req.labTitle}</div>
        </div>
        <div className="hidden flex-none items-center gap-3 sm:flex">
          {req.status === "held" && req.slaDueAt && <Countdown to={req.slaDueAt} />}
          <span className="text-[13px] font-semibold text-ink">{req.quantity} <span className="font-normal text-faint">vouchers</span></span>
        </div>
        <ChevronDown className={cn("h-4 w-4 flex-none text-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-line2">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Detail k="Purpose" v={req.purpose === "planned-delivery" ? "Planned delivery" : "Self-paced"} />
            <Detail k="Submitted" v={new Date(req.submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} />
            {req.delivery && <><Detail k="Engagement" v={req.delivery.engagement} /><Detail k="Partner" v={req.delivery.partner} /><Detail k="Dates" v={`${req.delivery.startDate} → ${req.delivery.endDate}`} /><Detail k="Attendees" v={String(req.delivery.expectedAttendees)} /></>}
          </div>
          {req.notes && <p className="border-t border-line2 px-4 py-3 text-[13px] leading-relaxed text-mut">{req.notes}</p>}
          {req.vouchers.length > 0 && <div className="border-t border-line2 p-4"><CodeStrip codes={req.vouchers} /></div>}
          <div className="border-t border-line2 px-4 py-3">
            <Link href={`/catalog/${req.labId}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
              View lab <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function WalletCard({ req }: { req: SandboxRequest }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-soft">
      <div className="flex items-center gap-2 border-b border-line2 px-4 py-3">
        <Ticket className="h-4 w-4 text-primary" />
        <span className="truncate text-[14px] font-bold text-ink">{req.labTitle}</span>
        <span className="ml-auto flex-none rounded-md bg-line2 px-2 py-0.5 text-[11px] font-bold text-slate">{req.vouchers.length}</span>
      </div>
      <div className="p-4"><CodeStrip codes={req.vouchers} /></div>
    </div>
  );
}

function CodeStrip({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(codes.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11.5px] font-bold uppercase tracking-wide text-faint">Voucher codes</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline">
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy all</>}
        </button>
      </div>
      <div className="grid max-h-[140px] grid-cols-1 gap-1.5 overflow-y-auto">
        {codes.map((c) => (
          <span key={c} className="rounded-lg bg-line2/60 px-3 py-1.5 font-mono text-[12.5px] font-semibold text-ink">{c}</span>
        ))}
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return <div><div className="text-[11.5px] text-faint">{k}</div><div className="text-[13.5px] font-semibold text-ink">{v}</div></div>;
}

function Empty({ wallet }: { wallet?: boolean }) {
  return (
    <div className="rounded-[18px] border border-dashed border-line bg-surface py-20 text-center">
      {wallet ? <Wallet className="mx-auto h-9 w-9 text-faint" /> : <Inbox className="mx-auto h-9 w-9 text-faint" />}
      <p className="mt-3 font-display text-[18px] font-bold text-ink">{wallet ? "No vouchers yet" : "No requests yet"}</p>
      <p className="mt-1 text-[14px] text-mut">Browse the catalog and request a lab to get started.</p>
      <Button href="/catalog" className="mt-5">Browse catalog <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}
