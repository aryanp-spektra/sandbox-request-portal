"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem("sbx-theme", theme);
  } catch {}
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
  };

  const dark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group grid h-9 w-9 place-items-center rounded-[11px] border border-line bg-surface text-mut transition-colors hover:border-[#cdd2e2] hover:text-ink",
        className
      )}
    >
      {/* render a stable icon until mounted to avoid hydration flash */}
      {mounted && dark ? (
        <Sun className="h-[18px] w-[18px] transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="h-[18px] w-[18px] transition-transform group-hover:-rotate-12" />
      )}
    </button>
  );
}
