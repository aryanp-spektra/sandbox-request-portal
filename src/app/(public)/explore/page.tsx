import { Suspense } from "react";
import { ExploreClient } from "../ExploreClient";

export const metadata = {
  title: "Explore the Microsoft Sandbox catalog",
  description:
    "Browse every guided lab, hackathon and sandbox in the Microsoft Sandbox program. Filter by level, workload and solution play, see what changed in Build 2026, and export to Excel or PDF.",
};

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="wrap-wide py-24 text-center text-faint">Loading catalog…</div>}>
      <ExploreClient />
    </Suspense>
  );
}
