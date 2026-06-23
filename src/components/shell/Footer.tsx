import { Boxes } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="wrap flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] aurora-fill shadow-[var(--shadow-glow)]">
            <Boxes className="h-[18px] w-[18px] text-white" />
          </span>
          <div className="text-[13px] leading-tight">
            <div className="font-display font-bold text-ink">Sandbox Portal</div>
            <div className="text-faint">Microsoft Sandbox · CloudLabs</div>
          </div>
        </div>
        <p className="text-[12.5px] text-faint">
          Self-service catalog & automated voucher fulfillment · Beta
        </p>
      </div>
    </footer>
  );
}
