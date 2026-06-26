"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGridIcon, LifeBuoyIcon, BookmarkIcon, MenuIcon, XIcon, LogInIcon,
} from "lucide-react";
import { BrandLockup, BrandMark } from "@/components/Brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Catalog", href: "/explore", icon: LayoutGridIcon },
  { label: "Saved labs", href: "/saved", icon: BookmarkIcon },
  { label: "Support", href: "/support", icon: LifeBuoyIcon },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Public marketplace app shell. A left sidebar carries the primary navigation
 * (mirrors the store-cloudlabs side nav); the slim topbar holds only the theme
 * toggle and a plain "Sign in" — there's no highlighted partner-portal CTA.
 * On mobile the sidebar collapses into a drawer opened from the topbar.
 */
export function MarketplaceShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarBody pathname={pathname} />
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl">
            <SidebarBody pathname={pathname} onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Content column ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <MenuIcon className="size-5" />
          </Button>
          <Link href="/" className="flex items-center lg:hidden" aria-label="CloudLabs home">
            <BrandLockup height={22} />
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link href="/login">
                <LogInIcon className="size-4" /> Sign in
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
        {footer}
      </div>
    </div>
  );
}

function SidebarBody({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center" aria-label="CloudLabs home">
          <BrandLockup height={24} />
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 font-medium text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sidebar-foreground/60 text-xs transition-colors hover:text-sidebar-foreground"
        >
          <BrandMark size={16} />
          Microsoft Sandbox catalog
        </Link>
      </div>
    </>
  );
}
