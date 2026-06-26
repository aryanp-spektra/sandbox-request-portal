import Link from "next/link";
import { LogInIcon } from "lucide-react";
import { BrandLockup } from "@/components/Brand";
import { LABS } from "@/lib/labs";

const COLUMNS = [
  {
    heading: "Catalog",
    links: [
      { label: "Browse all labs", href: "/explore" },
      { label: "AI Business Solutions", href: "/explore?area=AI+Business+Solutions" },
      { label: "Cloud & AI Platforms", href: "/explore?area=Cloud+%26+AI+Platforms" },
      { label: "Security", href: "/explore?area=Security" },
      { label: "Saved labs", href: "/saved" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Support", href: "/support" },
      { label: "CloudLabs Help Center", href: "https://help.cloudlabs.ai", external: true },
      { label: "Spektra Systems", href: "https://www.spektrasystems.com", external: true },
    ],
  },
];

// TODO: point these at the real Terms / Privacy / Cookie pages once published.
const LEGAL = [
  { label: "Terms of Service", href: "https://www.spektrasystems.com" },
  { label: "Privacy Policy", href: "https://www.spektrasystems.com" },
  { label: "Cookie Policy", href: "https://www.spektrasystems.com" },
];

const linkClass = "text-muted-foreground text-sm transition-colors hover:text-foreground";

export function MarketplaceFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-2">
            <BrandLockup height={26} />
            <p className="max-w-[280px] text-muted-foreground text-sm leading-relaxed">
              The Microsoft Sandbox catalog — {LABS.length} guided labs, hackathons and sandboxes,
              powered by CloudLabs.
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm">
              Are you a requester?
              <Link
                href="/login"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <LogInIcon className="size-3.5" /> Sign in
              </Link>
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    {"external" in link && link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Spektra Systems. Microsoft Sandbox, powered by CloudLabs.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {LEGAL.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground text-xs transition-colors hover:text-foreground hover:underline"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
