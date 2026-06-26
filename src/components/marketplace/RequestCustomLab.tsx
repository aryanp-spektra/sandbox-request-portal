"use client";

import { useState } from "react";
import { SparklesIcon, CheckIcon, MailIcon } from "lucide-react";
import { submitCustomLabAction } from "@/lib/data/inquiry-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PLATFORMS = [
  "Azure",
  "Microsoft 365 / Copilot",
  "Security (Defender / Sentinel / Entra)",
  "Power Platform",
  "Fabric / Data & Analytics",
  "Other / Not sure",
];

const DELIVERY_MODES = ["Self-paced", "Instructor-led", "Planned delivery / event"];

const SUPPORT_EMAIL = "sandbox-support@spektrasystems.com";

export function RequestCustomLab({
  variant = "outline",
  size = "sm",
  className,
  label = "Request a custom lab",
}: {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", organization: "", topic: "",
    platform: "", deliveryMode: "", audienceSize: "", targetDate: "", requirements: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await submitCustomLabAction({
        topic: form.topic,
        platform: form.platform || null,
        deliveryMode: form.deliveryMode || null,
        audienceSize: form.audienceSize ? Number(form.audienceSize) : null,
        targetDate: form.targetDate || null,
        name: form.name,
        email: form.email,
        organization: form.organization || null,
        requirements: form.requirements || null,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(() => { setDone(false); setError(null); }, 200);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <SparklesIcon className="size-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        {done ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckIcon className="size-7" />
            </span>
            <div className="space-y-1.5">
              <DialogTitle className="text-xl">Request sent</DialogTitle>
              <DialogDescription className="text-balance">
                We&apos;ve routed your request to the Sandbox team, we&apos;ll reply within one business day.
              </DialogDescription>
            </div>
            <Button className="mt-2 w-full sm:w-auto" onClick={() => setOpen(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request a custom lab</DialogTitle>
              <DialogDescription>
                Tell us what you need and we&apos;ll scope a sandbox for your engagement.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <MailIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Questions? Email</span>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium hover:underline">{SUPPORT_EMAIL}</a>
            </div>

            <div className="space-y-4 py-1">
              <Field label="What lab or topic do you need?" required>
                <Textarea
                  id="rl-topic"
                  value={form.topic}
                  onChange={(e) => set("topic")(e.target.value)}
                  placeholder="e.g. A hands-on lab on securing Azure OpenAI deployments…"
                  rows={3}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Platform">
                  <Select value={form.platform} onValueChange={set("platform")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select platform" /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Delivery mode">
                  <Select value={form.deliveryMode} onValueChange={set("deliveryMode")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select mode" /></SelectTrigger>
                    <SelectContent>
                      {DELIVERY_MODES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Expected attendees">
                  <Input
                    type="number" min={1}
                    value={form.audienceSize}
                    onChange={(e) => set("audienceSize")(e.target.value)}
                    placeholder="e.g. 25"
                  />
                </Field>
                <Field label="Target date">
                  <Input type="date" value={form.targetDate} onChange={(e) => set("targetDate")(e.target.value)} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" required>
                  <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Full name" />
                </Field>
                <Field label="Work email" required>
                  <Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="you@company.com" />
                </Field>
              </div>

              <Field label="Organization">
                <Input value={form.organization} onChange={(e) => set("organization")(e.target.value)} placeholder="Company / partner name" />
              </Field>

              <Field label="Anything else we should know?">
                <Textarea
                  value={form.requirements}
                  onChange={(e) => set("requirements")(e.target.value)}
                  placeholder="Modules, products, constraints, timelines…"
                  rows={3}
                />
              </Field>

              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} loading={submitting} disabled={!form.topic || !form.name || !form.email}>
                Send request
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
