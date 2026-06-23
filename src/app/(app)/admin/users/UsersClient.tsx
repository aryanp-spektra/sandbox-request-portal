"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, UserRound, UserPlus, Copy, Check, AlertCircle, KeyRound, Clock, CheckCircle2,
} from "lucide-react";
import { createUserAction, type CreatedUser } from "@/lib/auth/actions";
import type { Role, User } from "@/lib/auth/types";
import { cn } from "@/lib/cn";

type PublicUser = Omit<User, "passwordHash">;

export function UsersClient({ users }: { users: PublicUser[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("requester");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedUser | null>(null);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createUserAction({ username, email, role });
        setCreated(result);
        setUsername(""); setEmail(""); setRole("requester");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create the user.");
      }
    });
  };

  return (
    <main className="wrap-wide py-9">
      <div className="mb-7">
        <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-primary">
          <ShieldCheck className="h-4 w-4" /> Sandbox team, admin
        </div>
        <h1 className="mt-1 font-display text-[34px] font-extrabold tracking-tight text-ink">Users</h1>
        <p className="mt-1 text-[15px] text-mut">Create portal accounts and manage access. New users set their own password on first sign in.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* create */}
        <section className="rounded-[18px] border border-line bg-surface p-5 shadow-soft lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 flex items-center gap-2 font-display text-[16px] font-bold text-ink">
            <UserPlus className="h-4 w-4 text-primary" /> Add a user
          </h2>

          <div className="space-y-3.5">
            <Field label="Username">
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. prashanti" className={inputCls} />
            </Field>
            <Field label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@company.com" className={inputCls} />
            </Field>
            <Field label="Role">
              <div className="grid grid-cols-2 gap-2">
                <RolePick active={role === "requester"} onClick={() => setRole("requester")} icon={UserRound} label="Requester" />
                <RolePick active={role === "admin"} onClick={() => setRole("admin")} icon={ShieldCheck} label="Admin" />
              </div>
            </Field>

            {error && (
              <div className="flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 flex-none" /> {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={pending || !username.trim() || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-[11px] aurora-fill py-2.5 text-[14px] font-bold text-white shadow-[var(--shadow-glow)] transition-all hover:brightness-105 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" /> {pending ? "Creating…" : "Create user"}
            </button>
          </div>

          {created && <TempPasswordCard created={created} onDismiss={() => setCreated(null)} />}
        </section>

        {/* list */}
        <section className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-ink">All users</h2>
            <span className="rounded-md bg-line2 px-2 py-0.5 text-[12px] font-bold text-slate">{users.length}</span>
          </div>
          <div className="divide-y divide-line2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-full aurora-fill text-[12px] font-bold text-white">
                  {u.username.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-bold text-ink">{u.username}</span>
                    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide", u.role === "admin" ? "bg-primary/10 text-primary" : "bg-line2 text-slate")}>
                      {u.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}{u.role}
                    </span>
                  </div>
                  <div className="truncate text-[12.5px] text-faint">{u.email}</div>
                </div>
                {u.mustReset ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-held/10 px-2.5 py-1 text-[11.5px] font-semibold text-held">
                    <Clock className="h-3.5 w-3.5" /> Pending first sign in
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ready/10 px-2.5 py-1 text-[11.5px] font-semibold text-ready">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function TempPasswordCard({ created, onDismiss }: { created: CreatedUser; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(created.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="mt-4 rounded-[14px] border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-[13px] font-bold text-ink">
        <KeyRound className="h-4 w-4 text-primary" /> Temporary password for {created.username}
      </div>
      <p className="mt-1 text-[12.5px] text-mut">Share this with the user. They will be asked to set their own password on first sign in.</p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[14px] font-bold tracking-wide text-ink">{created.tempPassword}</code>
        <button onClick={copy} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface text-primary hover:bg-line2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <button onClick={onDismiss} className="mt-3 text-[12.5px] font-semibold text-mut hover:text-ink">Dismiss</button>
    </div>
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

function RolePick({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof UserRound; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-2 text-[13px] font-semibold transition-all",
        active ? "border-primary bg-primary/5 text-primary" : "border-line text-slate hover:border-[#cdd2e2]"
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

const inputCls =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-primary placeholder:text-faint";
