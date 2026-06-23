"use client";

import { useActionState } from "react";
import { KeyRound, AlertCircle, ShieldCheck } from "lucide-react";
import { resetPasswordAction, type FormState } from "@/lib/auth/actions";
import { AuthShell, AuthField, authInputCls } from "@/components/auth/AuthShell";

export function ResetForm({ username, firstTime }: { username: string; firstTime: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});

  return (
    <AuthShell
      title={firstTime ? "Set your password" : "Change your password"}
      subtitle={
        firstTime
          ? `Welcome, ${username}. Choose a password to finish setting up your account.`
          : `Signed in as ${username}.`
      }
    >
      <form action={formAction} className="space-y-4">
        <AuthField label="New password">
          <input name="password" type="password" autoFocus autoComplete="new-password" className={authInputCls} placeholder="At least 8 characters" />
        </AuthField>
        <AuthField label="Confirm new password">
          <input name="confirm" type="password" autoComplete="new-password" className={authInputCls} placeholder="Re-enter your password" />
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
          <KeyRound className="h-4 w-4" />
          {pending ? "Saving…" : "Save password and continue"}
        </button>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[12px] text-white/45">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your password is hashed and never stored in plain text.
        </p>
      </form>
    </AuthShell>
  );
}
