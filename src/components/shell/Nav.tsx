"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Command } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePortal } from "@/lib/store";
import { CommandSearch } from "./CommandSearch";
import { RoleSwitcher } from "./RoleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { BrandMark } from "@/components/Brand";

const LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/requests", label: "My Requests" },
  { href: "/admin", label: "Admin" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = usePortal((s) => s.role);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line glass">
        <nav className="wrap flex h-16 items-center gap-6">
          <Link href="/portal" className="flex items-center gap-2.5">
            <BrandMark size={36} />
            <span className="font-display text-[18px] font-extrabold tracking-tight text-ink">
              Sandbox<span className="aurora-text">.</span>
            </span>
          </Link>

          <div className="ml-1 hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              if (l.href === "/admin" && role !== "admin") return null;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                    active ? "text-ink bg-line2" : "text-mut hover:text-ink hover:bg-line2"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setOpen(true)}
            className="group hidden items-center gap-2 rounded-[11px] border border-line bg-surface px-3 py-2 text-[13px] text-faint transition-colors hover:border-[#cdd2e2] sm:flex"
          >
            <Search className="h-4 w-4" />
            <span className="pr-6">Search labs…</span>
            <kbd className="flex items-center gap-0.5 rounded-md border border-line bg-line2 px-1.5 py-0.5 text-[10px] font-semibold text-mut">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          <button
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-[11px] border border-line bg-surface text-mut sm:hidden"
          >
            <Search className="h-4 w-4" />
          </button>

          <ThemeToggle />
          <RoleSwitcher />
        </nav>
      </header>

      <CommandSearch open={open} onClose={() => setOpen(false)} />
    </>
  );
}
