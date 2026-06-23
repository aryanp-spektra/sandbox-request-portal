import { ArrowRight } from "lucide-react";
import type { Lab } from "@/lib/types";

/**
 * Shows how a lab moved from the FY26 solution-area / play taxonomy to the
 * FY27 one. The headline feature of the catalogue refresh: partners who know
 * the old names can see exactly where a play landed for FY27.
 */
export function FyMapping({ lab, className = "" }: { lab: Lab; className?: string }) {
  const hasFy26 = lab.fy26Area || lab.fy26Play;
  return (
    <div className={`grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch ${className}`}>
      <FyColumn
        year="FY26"
        area={lab.fy26Area}
        play={lab.fy26Play}
        tone="muted"
        empty={!hasFy26}
      />
      <div className="flex items-center justify-center sm:flex-col">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
          <ArrowRight className="h-4 w-4 sm:rotate-0" />
        </span>
      </div>
      <FyColumn year="FY27" area={lab.fy27Area} play={lab.fy27Play} tone="primary" />
    </div>
  );
}

function FyColumn({
  year,
  area,
  play,
  tone,
  empty = false,
}: {
  year: string;
  area: string | null;
  play: string | null;
  tone: "muted" | "primary";
  empty?: boolean;
}) {
  const primary = tone === "primary";
  return (
    <div
      className={`rounded-[14px] border p-4 ${
        primary ? "border-primary/30 bg-primary/[0.05]" : "border-line bg-surface"
      }`}
    >
      <span
        className={`text-[11px] font-extrabold uppercase tracking-wider ${
          primary ? "text-primary" : "text-faint"
        }`}
      >
        {year}
      </span>
      {empty ? (
        <p className="mt-1.5 text-[13px] italic text-faint">New for FY27, no FY26 lineage</p>
      ) : (
        <>
          <p className="mt-1.5 text-[12px] font-semibold text-faint">{area ?? "Unspecified"}</p>
          <p className="mt-0.5 text-[14.5px] font-bold leading-snug text-ink">{play ?? "Unspecified"}</p>
        </>
      )}
    </div>
  );
}
