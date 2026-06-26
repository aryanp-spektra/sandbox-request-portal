"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkIcon, ArrowRightIcon } from "lucide-react";
import { LABS } from "@/lib/labs";
import type { Lab } from "@/lib/types";
import { LabCard } from "@/components/marketplace/LabCard";
import { Button } from "@/components/ui/button";

const LS_KEY = "sbx-stars";

function readStarred(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * "Saved labs" — the labs this browser has starred (interest stars are kept in
 * localStorage, so this list is per-device and needs no sign-in). Reads the
 * starred IDs once on mount; `ready` guards against a flash of the empty state
 * during hydration.
 */
export function SavedLabsClient() {
  const [ready, setReady] = useState(false);
  const [labs, setLabs] = useState<Lab[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const ids = new Set(readStarred());
    setLabs(LABS.filter((l) => ids.has(l.id)));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <main>
      {/* header band */}
      <section className="relative overflow-hidden border-b">
        <div aria-hidden className="hero-aura -z-10" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="flex items-center gap-2.5 font-bold text-3xl tracking-display sm:text-4xl">
            <BookmarkIcon className="size-7 text-primary" /> Saved labs
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
            The labs you&apos;ve starred on this device. Star a lab anywhere in the catalog to keep it here.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!ready ? null : labs.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border bg-card py-16 text-center text-card-foreground">
            <span className="flex size-12 items-center justify-center rounded-2xl border bg-primary/5 text-primary">
              <BookmarkIcon className="size-6" />
            </span>
            <p className="font-semibold">You haven&apos;t saved any labs yet.</p>
            <p className="max-w-sm text-muted-foreground text-sm">
              Browse the catalog and tap the interest star on any lab to save it here for later.
            </p>
            <Button asChild>
              <Link href="/explore">
                Browse the catalog <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              <span className="font-semibold text-foreground">{labs.length}</span>{" "}
              saved {labs.length === 1 ? "lab" : "labs"}
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {labs.map((l) => (
                <LabCard key={l.id} lab={l} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
