import Link from "next/link";
import { Boxes, ArrowUpRight } from "lucide-react";
import { LABS } from "@/lib/labs";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line glass">
        <div className="wrap-wide flex h-16 items-center gap-4">
          <Link href="/explore" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] aurora-fill shadow-[var(--shadow-glow)]">
              <Boxes className="h-5 w-5 text-white" />
            </span>
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
        <div className="wrap-wide flex flex-col items-center justify-between gap-3 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[9px] aurora-fill">
              <Boxes className="h-[18px] w-[18px] text-white" />
            </span>
            <div className="text-[13px] leading-tight">
              <div className="font-display font-bold text-ink">Microsoft Sandbox</div>
              <div className="text-faint">Powered by CloudLabs, Spektra Systems</div>
            </div>
          </div>
          <p className="text-[12.5px] text-faint">
            This catalog is for reference. Voucher requests are handled through the partner portal.
          </p>
        </div>
      </footer>
    </>
  );
}
