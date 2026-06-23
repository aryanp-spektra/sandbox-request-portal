"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn, AlertCircle, ArrowLeft } from "lucide-react";
import { loginAction, type FormState } from "@/lib/auth/actions";
import { AuthShell, AuthField, authInputCls } from "@/components/auth/AuthShell";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <AuthShell
      title="Sign in to the partner portal"
      subtitle="Catalog, voucher requests and the Sandbox operations cockpit."
      footer={
        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to the public catalog
        </Link>
      }
    >
      <form action={formAction} className="space-y-4">
        <AuthField label="Username">
          <input name="username" autoFocus autoComplete="username" className={authInputCls} placeholder="admin" />
        </AuthField>
        <AuthField label="Password">
          <input name="password" type="password" autoComplete="current-password" className={authInputCls} placeholder="••••••••" />
        </AuthField>

        {state.error && (
          <div className="flex items-center gap-2 rounded-[11px] border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-[13px] font-medium text-red-200">
            <AlertCircle className="h-4 w-4 flex-none" />
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-[11px] aurora-fill py-3 text-[14.5px] font-bold text-white shadow-[var(--shadow-glow)] transition-all hover:brightness-105 disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
