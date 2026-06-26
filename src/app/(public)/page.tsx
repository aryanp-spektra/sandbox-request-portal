import { StoreLanding } from "./StoreLanding";
import { LABS, catalogStats } from "@/lib/labs";
import { SOLUTION_AREAS } from "@/lib/state";

export const metadata = {
  title: "Microsoft Sandbox Store — the FY27 lab catalog",
  description:
    "A single self-service store of Microsoft guided labs, hackathons and sandboxes across AI, cloud and security. Browse, compare and request access in minutes.",
};

export default function HomePage() {
  const stats = catalogStats();
  const areas = SOLUTION_AREAS.map((name) => ({
    name,
    count: LABS.filter((l) => l.solutionArea === name).length,
  }));

  return <StoreLanding stats={stats} areas={areas} />;
}
