"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "@/components/Brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Catalog", href: "/explore" },
  { label: "Support", href: "/support" },
];

/**
 * Public marketplace header. Logo left, primary nav center, partner action
 * right — mirrors the store-cloudlabs chrome.
 */
export function MarketplaceHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="CloudLabs home">
          <BrandLockup height={24} />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {NAV.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap font-medium text-sm transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" variant="outline">
            <Link href="/portal">Partner portal</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
