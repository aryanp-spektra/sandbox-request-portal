"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toggleStarAction } from "@/lib/data/star-actions";
import { cn } from "@/lib/cn";

const LS_KEY = "sbx-stars";

function readStarred(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeStarred(ids: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/**
 * Anonymous "interest" star. Optimistically toggles a per-browser flag
 * (localStorage) and a shared server-side count. `tone="dark"` renders the
 * glassy variant used on the violet detail-page header band.
 */
export function StarButton({
  labId,
  initialCount,
  tone = "light",
}: {
  labId: string;
  initialCount: number;
  tone?: "light" | "dark";
}) {
  const [count, setCount] = useState(initialCount);
  const [starred, setStarred] = useState(false);
  const [pending, setPending] = useState(false);

  // Read the browser's starred flag (an external system) once after mount; the
  // value isn't known during SSR, so setState-in-effect is the correct pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStarred(readStarred().includes(labId));
  }, [labId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = async () => {
    if (pending) return;
    const next = !starred;
    setPending(true);
    // optimistic
    setStarred(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const ids = readStarred();
    writeStarred(next ? [...new Set([...ids, labId])] : ids.filter((x) => x !== labId));
    try {
      const authoritative = await toggleStarAction(labId, next);
      setCount(authoritative);
    } catch {
      // revert on failure
      setStarred(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      writeStarred(next ? readStarred().filter((x) => x !== labId) : [...readStarred(), labId]);
    } finally {
      setPending(false);
    }
  };

  const dark = tone === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={starred}
      aria-label={starred ? "Remove your interest star" : "Star this lab to show interest"}
      title={starred ? "You're interested — click to remove" : "Star this lab to show interest"}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all active:translate-y-px",
        pending && "opacity-70",
        dark
          ? starred
            ? "border-white/30 bg-white/95 text-[#4d3cb3]"
            : "border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
          : starred
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-transform group-hover:scale-110",
          starred ? "fill-current" : "fill-transparent"
        )}
      />
      <span className="tabular-nums">{count.toLocaleString()}</span>
      <span className="hidden sm:inline">{starred ? "Interested" : "Interested?"}</span>
    </button>
  );
}
