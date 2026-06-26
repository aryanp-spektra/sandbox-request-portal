import Link from "next/link";
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
    ],
  },
  {
    heading: "Partner",
    links: [
      { label: "Partner portal", href: "/portal" },
      { label: "My requests", href: "/requests" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "CloudLabs Help Center", href: "https://help.cloudlabs.ai", external: true },
      { label: "Spektra Systems", href: "https://www.spektrasystems.com", external: true },
    ],
  },
];

export function MarketplaceFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1">
            <BrandLockup height={26} />
            <p className="max-w-[240px] text-muted-foreground text-sm leading-relaxed">
              The Microsoft Sandbox catalog — {LABS.length} guided labs, hackathons and sandboxes,
              powered by CloudLabs.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                      >
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
          <p className="text-muted-foreground text-xs">
            For reference — voucher requests are handled in the partner portal.
          </p>
        </div>
      </div>
    </footer>
  );
}
