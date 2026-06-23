import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LABS } from "@/lib/labs";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { BrandMark, BrandLockup } from "@/components/Brand";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line glass">
        <div className="wrap-wide flex h-16 items-center gap-4">
          <Link href="/explore" className="flex items-center gap-2.5">
            <BrandMark size={38} />
            <span className="leading-tight">
              <span className="block font-display text-[16px] font-extrabold tracking-tight text-ink">
                Microsoft Sandbox
              </span>
              <span className="block text-[11.5px] font-medium text-faint">Lab Catalog, FY27</span>
            </span>
          </Link>

          <div className="flex-1" />

          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-mut sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-ready)" }} />
            {LABS.length} labs, updated for Build 2026
          </span>
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-slate transition-colors hover:border-[#cdd2e2]"
          >
            Partner portal
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="min-h-[calc(100vh-180px)]">{children}</div>

      <footer className="mt-16 border-t border-line bg-surface">
        <div className="wrap-wide flex flex-col items-center justify-between gap-5 py-10 text-center sm:flex-row sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <BrandLockup height={30} />
            <p className="text-[12.5px] text-mut">
              Microsoft Sandbox, powered by CloudLabs from Spektra Systems.
            </p>
          </div>
          <p className="max-w-[340px] text-[12.5px] leading-relaxed text-faint">
            This catalog is for reference. Voucher requests are handled through the partner portal.
          </p>
        </div>
      </footer>
    </>
  );
}
