"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/types";

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        className="flex items-center gap-2 rounded-[11px] border border-line bg-surface px-2 py-1.5 transition-colors hover:border-[#cdd2e2]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full aurora-fill text-[11px] font-bold text-white">{initials}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[12.5px] font-bold text-ink">{user.username}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-faint">{user.role}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-faint" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-[230px] rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow-lift)]">
          <div className="px-3 py-2">
            <div className="text-[13px] font-bold text-ink">{user.username}</div>
            <div className="truncate text-[12px] text-faint">{user.email}</div>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary/8 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-primary">
              {user.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
              {user.role}
            </span>
          </div>
          <div className="my-1 h-px bg-line2" />
          <Link href="/reset-password" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-slate hover:bg-line2">
            <KeyRound className="h-4 w-4" /> Change password
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
