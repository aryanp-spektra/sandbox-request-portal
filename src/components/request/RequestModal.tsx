"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, CalendarDays, Rocket, ArrowRight, ArrowLeft, Zap, Clock, Copy, Check,
  PartyPopper, Inbox, Ticket,
} from "lucide-react";
import type { Lab, SandboxRequest, VoucherPurpose } from "@/lib/types";
import { usePortal } from "@/lib/store";
import { evaluate } from "@/lib/rules";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Step = "purpose" | "details" | "review" | "result";

export function RequestModal({ lab, open, onClose }: { lab: Lab; open: boolean; onClose: () => void }) {
  const submit = usePortal((s) => s.submitRequest);

  const [step, setStep] = useState<Step>("purpose");
  const [purpose, setPurpose] = useState<VoucherPurpose>("planned-delivery");
  const [qty, setQty] = useState(10);
  const [engagement, setEngagement] = useState("");
  const [partner, setPartner] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [attendees, setAttendees] = useState(10);
  const [result, setResult] = useState<SandboxRequest | null>(null);

  const reset = () => {
    setStep("purpose"); setPurpose("planned-delivery"); setQty(10);
    setEngagement(""); setPartner(""); setStart(""); setEnd(""); setAttendees(10); setResult(null);
  };
  const close = () => { onClose(); setTimeout(reset, 250); };

  const handleSubmit = () => {
    const req = submit({
      lab, quantity: qty, purpose,
      delivery: purpose === "planned-delivery"
        ? { engagement, partner, startDate: start, endDate: end, expectedAttendees: attendees }
        : null,
      requesterName: "Prashanti Tembhare", requesterOrg: "WaferWire LLC",
    });
    setResult(req);
    setStep("result");
  };

  const detailsValid = purpose === "self-paced" ? qty > 0 : engagement && partner && start && end && qty > 0;
  const preview = evaluate(lab, { quantity: qty });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={close} />
          <motion.div
            className="relative flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[22px] bg-surface shadow-[var(--shadow-lift)] sm:rounded-[22px]"
            initial={{ y: 40, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wide text-faint">{lab.typeLabel} · voucher request</div>
                <div className="truncate font-display text-[16px] font-bold text-ink">{lab.title}</div>
              </div>
              <button onClick={close} className="ml-3 grid h-8 w-8 flex-none place-items-center rounded-lg text-faint hover:bg-line2 hover:text-ink">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* progress */}
            {step !== "result" && (
              <div className="flex gap-1.5 px-5 pt-4">
                {(["purpose", "details", "review"] as Step[]).map((s) => {
                  const idx = ["purpose", "details", "review"].indexOf(s);
                  const cur = ["purpose", "details", "review"].indexOf(step);
                  return <span key={s} className={cn("h-1 flex-1 rounded-full", idx <= cur ? "aurora-fill" : "bg-line")} />;
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <AnimatePresence mode="wait">
                {step === "purpose" && (
                  <StepWrap key="purpose">
                    <h3 className="mb-1 font-display text-[18px] font-bold text-ink">What&apos;s this for?</h3>
                    <p className="mb-4 text-[13.5px] text-mut">This tailors the details we collect.</p>
                    <div className="space-y-3">
                      <PurposeCard
                        active={purpose === "planned-delivery"} onClick={() => setPurpose("planned-delivery")}
                        icon={CalendarDays} title="Planned delivery"
                        desc="A scheduled engagement, workshop or event with a partner and dates."
                      />
                      <PurposeCard
                        active={purpose === "self-paced"} onClick={() => setPurpose("self-paced")}
                        icon={Rocket} title="Self-paced / self-based"
                        desc="Vouchers for individual, self-driven exploration. Just a quantity."
                      />
                    </div>
                  </StepWrap>
                )}

                {step === "details" && (
                  <StepWrap key="details">
                    <h3 className="mb-4 font-display text-[18px] font-bold text-ink">Request details</h3>
                    <div className="space-y-4">
                      {purpose === "planned-delivery" && (
                        <>
                          <Field label="Engagement / event name">
                            <input value={engagement} onChange={(e) => setEngagement(e.target.value)} placeholder="e.g. Copilot Enablement Workshop" className={inputCls} />
                          </Field>
                          <Field label="Partner / customer">
                            <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="e.g. Contoso" className={inputCls} />
                          </Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Start date"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} /></Field>
                            <Field label="End date"><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} /></Field>
                          </div>
                          <Field label="Expected attendees">
                            <input type="number" min={1} value={attendees} onChange={(e) => { const v = +e.target.value; setAttendees(v); setQty(v); }} className={inputCls} />
                          </Field>
                        </>
                      )}
                      <Field label="Vouchers needed">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-lg border border-line text-mut hover:bg-line2">–</button>
                          <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} className={cn(inputCls, "text-center font-bold")} />
                          <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center rounded-lg border border-line text-mut hover:bg-line2">+</button>
                        </div>
                      </Field>
                    </div>
                  </StepWrap>
                )}

                {step === "review" && (
                  <StepWrap key="review">
                    <h3 className="mb-4 font-display text-[18px] font-bold text-ink">Review & submit</h3>
                    <div className="overflow-hidden rounded-[14px] border border-line">
                      <Row k="Lab" v={lab.title} />
                      <Row k="Purpose" v={purpose === "planned-delivery" ? "Planned delivery" : "Self-paced"} />
                      {purpose === "planned-delivery" && <><Row k="Engagement" v={engagement} /><Row k="Partner" v={partner} /><Row k="Dates" v={`${start} → ${end}`} /></>}
                      <Row k="Vouchers" v={String(qty)} last />
                    </div>
                    <div className="mt-4 flex items-start gap-2.5 rounded-[12px] p-3.5" style={{ background: preview.outcome === "instant" ? "var(--st-ready-bg)" : "var(--st-held-bg)" }}>
                      {preview.outcome === "instant" ? <Zap className="mt-0.5 h-4 w-4 flex-none" style={{ color: "var(--color-ready)" }} /> : <Clock className="mt-0.5 h-4 w-4 flex-none" style={{ color: "var(--color-held)" }} />}
                      <p className="text-[12.5px] leading-relaxed" style={{ color: preview.outcome === "instant" ? "var(--st-ready-ink)" : "var(--st-held-ink)" }}>
                        {preview.outcome === "instant" ? "This lab is Ready, your vouchers issue the moment you submit." : `This lab needs validation, your request will be held and routed. ${preview.sla?.label}.`}
                      </p>
                    </div>
                  </StepWrap>
                )}

                {step === "result" && result && (
                  <StepWrap key="result">
                    <ResultView req={result} onClose={close} />
                  </StepWrap>
                )}
              </AnimatePresence>
            </div>

            {/* footer nav */}
            {step !== "result" && (
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
                {step !== "purpose" ? (
                  <Button variant="ghost" onClick={() => setStep(step === "review" ? "details" : "purpose")}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                ) : <span />}
                {step === "purpose" && <Button onClick={() => setStep("details")}>Continue <ArrowRight className="h-4 w-4" /></Button>}
                {step === "details" && <Button onClick={() => setStep("review")} disabled={!detailsValid}>Review <ArrowRight className="h-4 w-4" /></Button>}
                {step === "review" && <Button onClick={handleSubmit}>Submit request <ArrowRight className="h-4 w-4" /></Button>}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] outline-none transition-colors focus:border-primary placeholder:text-faint";

function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}

function PurposeCard({ active, onClick, icon: Icon, title, desc }: { active: boolean; onClick: () => void; icon: typeof Rocket; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-start gap-3.5 rounded-[14px] border p-4 text-left transition-all", active ? "border-primary bg-primary/5 shadow-soft" : "border-line hover:border-[#cdd2e2]")}>
      <span className={cn("grid h-10 w-10 flex-none place-items-center rounded-[11px]", active ? "aurora-fill text-white" : "bg-line2 text-mut")}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block font-display text-[15px] font-bold text-ink">{title}</span>
        <span className="block text-[12.5px] leading-relaxed text-mut">{desc}</span>
      </span>
      <span className={cn("mt-1 grid h-5 w-5 flex-none place-items-center rounded-full border-2", active ? "border-primary" : "border-line")}>
        {active && <span className="h-2.5 w-2.5 rounded-full aurora-fill" />}
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]", !last && "border-b border-line")}>
      <span className="text-faint">{k}</span>
      <span className="truncate font-semibold text-ink">{v}</span>
    </div>
  );
}

function ResultView({ req, onClose }: { req: SandboxRequest; onClose: () => void }) {
  const instant = req.status === "instant-fulfilled";
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full"
        style={{ background: instant ? "var(--st-ready-bg)" : "var(--st-held-bg)" }}
      >
        {instant ? <PartyPopper className="h-8 w-8" style={{ color: "var(--color-ready)" }} /> : <Inbox className="h-8 w-8" style={{ color: "var(--color-held)" }} />}
      </motion.div>

      <h3 className="mt-4 font-display text-[20px] font-extrabold text-ink">
        {instant ? "Vouchers issued!" : "Request received & held"}
      </h3>
      <p className="mx-auto mt-1.5 max-w-[400px] text-[13.5px] leading-relaxed text-mut">
        {instant
          ? `${req.quantity} voucher${req.quantity > 1 ? "s" : ""} for "${req.labTitle}", ready to share with your customer now.`
          : `We've routed your request to the Sandbox team for validation. Vouchers release automatically once the lab is marked Ready, within 3 days.`}
      </p>

      {instant && <VoucherList codes={req.vouchers} />}

      {!instant && (
        <div className="mt-5 rounded-[14px] border border-line bg-line2/50 p-4 text-left">
          <div className="flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-wide text-held"><Clock className="h-4 w-4" /> Tracking {req.id}</div>
          <p className="mt-1.5 text-[12.5px] text-mut">You&apos;ll get an email the moment they&apos;re generated. Track status any time in My Requests.</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button href="/requests" className="flex-1" onClick={onClose}>
          <Ticket className="h-4 w-4" /> View in My Requests
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">Done</Button>
      </div>
    </div>
  );
}

function VoucherList({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const copyAll = () => {
    navigator.clipboard?.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="mt-5 text-left">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12.5px] font-bold uppercase tracking-wide text-faint">{codes.length} voucher codes</span>
        <button onClick={copyAll} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline">
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy all</>}
        </button>
      </div>
      <div className="max-h-[160px] space-y-1.5 overflow-y-auto rounded-[12px] border border-line bg-line2/40 p-2.5">
        {codes.map((c) => (
          <div key={c} className="rounded-lg bg-surface px-3 py-2 font-mono text-[13px] font-semibold tracking-wide text-ink shadow-soft">
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
