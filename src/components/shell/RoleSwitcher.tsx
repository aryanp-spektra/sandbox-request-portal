"use client";

import { useRouter } from "next/navigation";
import { UserRound, ShieldCheck } from "lucide-react";
import { usePortal, type Role } from "@/lib/store";
import { cn } from "@/lib/cn";

const OPTS: { role: Role; label: string; icon: typeof UserRound }[] = [
  { role: "requester", label: "Requester", icon: UserRound },
  { role: "admin", label: "Sandbox team", icon: ShieldCheck },
];

export function RoleSwitcher() {
  const role = usePortal((s) => s.role);
  const setRole = usePortal((s) => s.setRole);
  const router = useRouter();

  return (
    <div className="flex items-center gap-0.5 rounded-[11px] border border-line bg-line2 p-0.5">
      {OPTS.map((o) => {
        const active = role === o.role;
        const Icon = o.icon;
        return (
          <button
            key={o.role}
            title={`View as ${o.label}`}
            onClick={() => {
              setRole(o.role);
              if (o.role === "requester") router.push("/catalog");
              else router.push("/admin");
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-[12.5px] font-semibold transition-all",
              active ? "bg-surface text-ink shadow-soft" : "text-mut hover:text-ink"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
