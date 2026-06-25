import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "outline" | "subtle" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[11px] transition-all duration-150 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "text-white brand-fill shadow-[var(--shadow-glow)] hover:brightness-110 hover:shadow-[0_16px_40px_color-mix(in_srgb,var(--color-primary)_38%,transparent)]",
  dark: "bg-ink text-white hover:bg-ink2 shadow-soft",
  outline: "border border-line bg-surface text-slate hover:border-[#cdd2e2] hover:bg-line2",
  ghost: "text-slate hover:bg-line2",
  subtle: "bg-line2 text-slate hover:bg-line",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] px-3 py-2",
  md: "text-[14px] px-4 py-2.5",
  lg: "text-[15px] px-5 py-3",
};

type Props = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & (
  | ({ href: string } & React.ComponentProps<typeof Link>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

export function Button({ variant = "primary", size = "md", className, children, ...props }: Props) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (props.href !== undefined) {
    const { href, ...rest } = props as { href: string } & React.ComponentProps<typeof Link>;
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
