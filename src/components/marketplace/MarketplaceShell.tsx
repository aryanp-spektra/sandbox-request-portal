"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGridIcon, LifeBuoyIcon, BookmarkIcon, MenuIcon, XIcon, LogInIcon,
  PanelLeftCloseIcon, PanelLeftOpenIcon,
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

const LS_KEY = "sbx-nav-pinned";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Public marketplace app shell. The left sidebar is an icon rail by default and
 * expands to the full labelled menu either when pinned (explicit toggle,
 * remembered in localStorage) or while hovered — the hover "peek" overlays the
 * content instead of shoving it. On mobile it collapses into a drawer.
 */
export function MarketplaceShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile drawer
  const [pinned, setPinned] = useState(false); // desktop expanded + pinned
  const [hover, setHover] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Close the mobile drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  // Restore the pinned preference once after mount.
  useEffect(() => {
    try {
      setPinned(localStorage.getItem(LS_KEY) === "1");
    } catch {}
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const togglePin = () =>
    setPinned((p) => {
      const next = !p;
      try {
        localStorage.setItem(LS_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });

  const wide = pinned || hover;

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop sidebar (icon rail → expands) ─────────────────────── */}
      <aside
        className={cn(
          "sticky top-0 z-40 hidden h-screen shrink-0 transition-[width] duration-200 ease-out lg:block",
          pinned ? "w-60" : "w-16"
        )}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className={cn(
            "flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
            wide ? "w-60" : "w-16",
            // hover-peek floats over the content; pinned reserves layout width
            !pinned && hover ? "absolute inset-y-0 left-0 shadow-xl" : "relative"
          )}
        >
          <SidebarBody pathname={pathname} expanded={wide} pinned={pinned} onTogglePin={togglePin} />
        </div>
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
            <SidebarBody pathname={pathname} expanded onClose={() => setOpen(false)} />
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
  expanded,
  pinned,
  onTogglePin,
  onClose,
}: {
  pathname: string;
  expanded: boolean;
  pinned?: boolean;
  onTogglePin?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {/* header: logo + (mobile close / desktop pin toggle) */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          expanded ? "justify-between px-4" : "justify-center px-2"
        )}
      >
        <Link href="/" className="flex items-center overflow-hidden" aria-label="CloudLabs home">
          {expanded ? <BrandLockup height={24} /> : <BrandMark size={26} />}
        </Link>
        {onClose ? (
          <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        ) : expanded && onTogglePin ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={pinned ? "Collapse sidebar" : "Pin sidebar open"}
            title={pinned ? "Collapse sidebar" : "Pin open"}
            onClick={onTogglePin}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <PanelLeftCloseIcon className="size-4" />
          </Button>
        ) : null}
      </div>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md py-2 font-medium text-sm transition-colors",
                expanded ? "gap-3 px-3" : "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* footer: desktop expand/collapse control */}
      {!onClose && onTogglePin && (
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={onTogglePin}
            aria-label={pinned ? "Collapse sidebar" : "Expand sidebar"}
            title={pinned ? "Collapse" : "Expand"}
            className={cn(
              "flex w-full items-center rounded-md py-2 font-medium text-sidebar-foreground/60 text-sm transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              expanded ? "gap-3 px-3" : "justify-center px-0"
            )}
          >
            {pinned ? (
              <PanelLeftCloseIcon className="size-4 shrink-0" />
            ) : (
              <PanelLeftOpenIcon className="size-4 shrink-0" />
            )}
            {expanded && <span className="truncate">{pinned ? "Collapse" : "Expand"}</span>}
          </button>
        </div>
      )}
    </>
  );
}
