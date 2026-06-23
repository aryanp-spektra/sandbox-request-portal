"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft } from "lucide-react";
import { LABS } from "@/lib/labs";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { TYPE_META } from "@/lib/state";

export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pool = s
      ? LABS.filter((l) =>
          [l.title, l.skillArea, l.solutionArea, ...l.products].join(" ").toLowerCase().includes(s)
        )
      : LABS.filter((l) => l.requestable);
    return pool.slice(0, 7);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === "Enter" && results[active]) {
        router.push(`/catalog/${results[active].id}`);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active, onClose, router]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[620px] overflow-hidden rounded-[18px] border border-line bg-surface shadow-[var(--shadow-lift)]"
            initial={{ scale: 0.97, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-5 w-5 text-faint" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Search 178 labs, hackathons & sandboxes…"
                className="w-full bg-transparent py-4 text-[15px] outline-none placeholder:text-faint"
              />
              <kbd className="rounded-md border border-line bg-line2 px-1.5 py-0.5 text-[10px] font-semibold text-mut">
                ESC
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <p className="px-3 py-8 text-center text-[13px] text-faint">
                  No labs match “{q}”.
                </p>
              )}
              {results.map((l, i) => {
                const meta = TYPE_META[l.type];
                return (
                  <button
                    key={l.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      router.push(`/catalog/${l.id}`);
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left transition-colors"
                    style={{ background: i === active ? "var(--color-line2)" : "transparent" }}
                  >
                    <span
                      className="grid h-8 w-8 flex-none place-items-center rounded-lg text-[11px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent2})` }}
                    >
                      {meta.label.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">{l.title}</span>
                      <span className="block truncate text-[12px] text-faint">
                        {meta.label} · {l.solutionArea}
                      </span>
                    </span>
                    <LifecycleBadge state={l.lifecycle} size="sm" withDot={false} />
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 flex-none text-faint" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
