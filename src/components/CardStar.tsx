"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toggleStarAction } from "@/lib/data/star-actions";
import { cn } from "@/lib/utils";

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
 * Compact interest star for lab cards. A small circular toggle that lives as an
 * overlay in a card's top-right corner (rendered as a sibling of the card's
 * <Link>, never nested inside it). Tracks the per-browser starred flag in
 * localStorage and nudges the shared server-side count. `count` is optional —
 * pass it on surfaces where the authoritative count is known (e.g. a trending
 * rail); the catalog grid renders the icon alone.
 */
export function CardStar({
  labId,
  count,
  className,
}: {
  labId: string;
  count?: number;
  className?: string;
}) {
  const [starred, setStarred] = useState(false);
  const [n, setN] = useState(count ?? 0);
  const [pending, setPending] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStarred(readStarred().includes(labId));
  }, [labId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = async (e: React.MouseEvent) => {
    // The card is a big <Link>; keep the click on the star only.
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const next = !starred;
    setPending(true);
    setStarred(next);
    setN((c) => Math.max(0, c + (next ? 1 : -1)));
    const ids = readStarred();
    writeStarred(next ? [...new Set([...ids, labId])] : ids.filter((x) => x !== labId));
    try {
      const authoritative = await toggleStarAction(labId, next);
      setN(authoritative);
    } catch {
      setStarred(!next);
      setN((c) => Math.max(0, c + (next ? -1 : 1)));
      writeStarred(next ? readStarred().filter((x) => x !== labId) : [...readStarred(), labId]);
    } finally {
      setPending(false);
    }
  };

  const showCount = count !== undefined;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={starred}
      aria-label={starred ? "Remove your interest star" : "Star this lab to show interest"}
      title={starred ? "You're interested — click to remove" : "Star this lab to show interest"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold text-xs transition-all active:scale-95",
        showCount ? "px-2.5 py-1" : "size-8 justify-center p-0",
        pending && "opacity-70",
        starred
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card/90 text-muted-foreground backdrop-blur hover:border-primary/40 hover:text-primary",
        className
      )}
    >
      <Star className={cn("size-4 shrink-0", starred ? "fill-current" : "fill-transparent")} />
      {showCount && <span className="tabular-nums">{n.toLocaleString()}</span>}
    </button>
  );
}
