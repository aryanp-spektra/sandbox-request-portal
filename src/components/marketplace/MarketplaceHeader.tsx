"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react";
import { BrandLockup } from "@/components/Brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV = [{ label: "Browse", href: "/explore" }];

const RESOURCES = [
  { label: "CloudLabs Help Center", href: "https://help.cloudlabs.ai" },
  { label: "Spektra Systems", href: "https://www.spektrasystems.com" },
];

/**
 * Public marketplace header. Logo anchors the left, primary nav centers,
 * account actions sit right — mirrors the store-cloudlabs chrome.
 */
export function MarketplaceHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="CloudLabs home">
          <BrandLockup height={24} />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-5 md:flex">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                Resources
                <ChevronDownIcon className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {RESOURCES.map((r) => (
                <DropdownMenuItem key={r.href} asChild>
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    {r.label}
                    <ExternalLinkIcon className="size-3 text-muted-foreground" />
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/portal">Partner portal</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
