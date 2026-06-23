import { BrandLockup } from "@/components/Brand";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="wrap flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex flex-col items-center gap-2.5 sm:items-start">
          <BrandLockup height={28} />
          <div className="text-[12.5px] text-faint">Microsoft Sandbox program</div>
        </div>
        <p className="text-[12.5px] text-faint">
          Self-service catalog & automated voucher fulfillment · Beta
        </p>
      </div>
    </footer>
  );
}
