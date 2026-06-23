import { BrandLockupWhite } from "@/components/Brand";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="deep relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <BrandLockupWhite height={34} className="mb-6" />
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-1.5 text-[14px] text-white/65">{subtitle}</p>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-6 shadow-[var(--shadow-lift)] backdrop-blur-xl sm:p-7">
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-[13px] text-white/55">{footer}</div>}

        <p className="mt-8 text-center text-[12px] text-white/40">
          Microsoft Sandbox, powered by CloudLabs from Spektra Systems
        </p>
      </div>
    </main>
  );
}

/** Shared field + input styling for the auth forms. */
export function AuthField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-white/80">{label}</span>
      {children}
    </label>
  );
}

export const authInputCls =
  "w-full rounded-[11px] border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14.5px] text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/40 focus:bg-white/[0.09]";
