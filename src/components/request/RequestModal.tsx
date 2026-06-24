"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Inbox, Ticket, CalendarClock, Send } from "lucide-react";
import type { Lab, SandboxRequest } from "@/lib/types";
import { usePortal } from "@/lib/store";
import { voucherRequestMailto, SUPPORT_EMAIL } from "@/lib/request";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const REQUESTER = { name: "Prashanti Tembhare", org: "WaferWire LLC" };

/**
 * Voucher request. Deliberately minimal: pick a quantity, optionally say when
 * it is needed by and add any custom requirements, then submit. Submitting
 * opens a prefilled email to CloudLabs support (live issuance is gated on a
 * CloudLabs release) and logs the request to My Requests.
 */
export function RequestModal({ lab, open, onClose }: { lab: Lab; open: boolean; onClose: () => void }) {
  const submit = usePortal((s) => s.submitRequest);

  const [customer, setCustomer] = useState("");
  const [qty, setQty] = useState(1);
  const [neededBy, setNeededBy] = useState("");
  const [customReq, setCustomReq] = useState("");
  const [result, setResult] = useState<SandboxRequest | null>(null);
  const [mailtoHref, setMailtoHref] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setCustomer(""); setQty(1); setNeededBy(""); setCustomReq(""); setResult(null); setMailtoHref(""); setSubmitting(false); };
  const close = () => { onClose(); setTimeout(reset, 250); };

  const valid = customer.trim().length > 0 && qty >= 1;

  const handleSubmit = async () => {
    if (submitting || !valid) return;
    setSubmitting(true);
    const href = voucherRequestMailto(lab, {
      quantity: qty, customerName: customer, neededBy, customRequirements: customReq,
      requesterName: REQUESTER.name, requesterOrg: REQUESTER.org,
    });
    setMailtoHref(href);
    try {
      const req = await submit({
        labId: lab.id, quantity: qty, customerName: customer.trim(),
        neededBy: neededBy || null, customRequirements: customReq || null,
      });
      setResult(req);
      // open the user's mail client with the prefilled request
      window.location.href = href;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={close} />
          <motion.div
            className="relative flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[22px] bg-surface shadow-[var(--shadow-lift)] sm:rounded-[22px]"
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

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {result ? (
                <ResultView req={result} mailtoHref={mailtoHref} onClose={close} />
              ) : (
                <div className="space-y-5">
                  <Field label="Customer / organization">
                    <input
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      placeholder="Who are these vouchers for? e.g. Contoso"
                      className={inputCls}
                      autoFocus
                      aria-label="Customer or organization name"
                    />
                  </Field>

                  <Field label="How many vouchers?">
                    <div className="flex items-center gap-2">
                      <Stepper onClick={() => setQty((q) => Math.max(1, q - 1))}>–</Stepper>
                      <input
                        type="number" min={1} value={qty}
                        onChange={(e) => setQty(Math.max(1, Math.floor(+e.target.value) || 1))}
                        className={cn(inputCls, "text-center font-bold")}
                        aria-label="Number of vouchers"
                      />
                      <Stepper onClick={() => setQty((q) => q + 1)}>+</Stepper>
                    </div>
                  </Field>

                  <Field label="When do you need them by?" hint="Optional">
                    <div className="relative">
                      <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                      <input
                        type="date" value={neededBy}
                        onChange={(e) => setNeededBy(e.target.value)}
                        className={cn(inputCls, "pl-9")}
                        aria-label="Date vouchers are needed by"
                      />
                    </div>
                  </Field>

                  <Field label="Custom requirements" hint="Optional">
                    <textarea
                      value={customReq}
                      onChange={(e) => setCustomReq(e.target.value)}
                      rows={3}
                      placeholder="Anything to flag, e.g. extend the lab duration, a specific Azure region, or bundling multiple labs."
                      className={cn(inputCls, "resize-none")}
                    />
                  </Field>

                  <div className="flex items-start gap-2.5 rounded-[12px] bg-primary/5 p-3.5">
                    <Mail className="mt-0.5 h-4 w-4 flex-none text-primary" />
                    <p className="text-[12.5px] leading-relaxed text-slate">
                      Submitting opens a prefilled email to CloudLabs support ({SUPPORT_EMAIL}). Add anything
                      else there and hit send; they issue the vouchers and reply to you. A copy is tracked in My Requests.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!result && (
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
                <Button variant="ghost" onClick={close}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!valid || submitting}>
                  <Send className="h-4 w-4" /> {submitting ? "Sending…" : "Send request"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-primary placeholder:text-faint";

function Stepper({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="grid h-10 w-11 flex-none place-items-center rounded-lg border border-line text-[18px] font-semibold text-mut transition-colors hover:bg-line2 hover:text-ink">
      {children}
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-slate">{label}</span>
        {hint && <span className="text-[11px] font-medium text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ResultView({ req, mailtoHref, onClose }: { req: SandboxRequest; mailtoHref: string; onClose: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full"
        style={{ background: "var(--st-held-bg)" }}
      >
        <Inbox className="h-8 w-8" style={{ color: "var(--color-held)" }} />
      </motion.div>

      <h3 className="mt-4 font-display text-[20px] font-extrabold text-ink">Request sent to support</h3>
      <p className="mx-auto mt-1.5 max-w-[420px] text-[13.5px] leading-relaxed text-mut">
        We opened a prefilled email to CloudLabs support for {req.quantity} voucher{req.quantity > 1 ? "s" : ""} of
        &nbsp;&ldquo;{req.labTitle}&rdquo;. Send it and they will issue the vouchers and reply to you.
      </p>

      <div className="mt-5 rounded-[14px] border border-line bg-line2/50 p-4 text-left">
        <div className="flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-wide text-held">
          <Inbox className="h-4 w-4" /> Tracking {req.id}
        </div>
        <p className="mt-1.5 text-[12.5px] text-mut">
          If your mail client did not open, use the button below. This request is saved in My Requests.
        </p>
      </div>

      <a
        href={mailtoHref}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-slate transition-colors hover:border-primary hover:text-primary"
      >
        <Mail className="h-4 w-4 text-primary" /> Reopen support email
      </a>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button href="/requests" className="flex-1" onClick={onClose}>
          <Ticket className="h-4 w-4" /> View in My Requests
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">Done</Button>
      </div>
    </div>
  );
}
