import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeftIcon, LayersIcon, SparklesIcon, RefreshCwIcon, Wand2Icon,
  ShuffleIcon, TagIcon, ChevronRightIcon, BoxesIcon,
} from "lucide-react";
import { getLab, LABS } from "@/lib/labs";
import { TYPE_META, lifecycleConfig } from "@/lib/state";
import { getStarCount } from "@/lib/data/stars";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { StarButton } from "@/components/StarButton";
import { FyMapping } from "@/components/FyMapping";
import { RecentRecorder } from "@/components/RecentRecorder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lab = getLab(id);
  return {
    title: lab ? `${lab.title}, Microsoft Sandbox` : "Lab, Microsoft Sandbox",
    description: lab?.hook,
  };
}

function fmtDate(iso: string | null) {
  if (!iso) return "New for Build 2026";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function PublicLabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lab = getLab(id);
  if (!lab) notFound();

  const meta = TYPE_META[lab.type];
  const cfg = lifecycleConfig(lab.lifecycle);
  const stars = await getStarCount(lab.id);
  const related = LABS.filter((l) => l.id !== lab.id && l.solutionArea === lab.solutionArea).slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <RecentRecorder id={lab.id} />

      {/* breadcrumb + star */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Back to catalog
        </Link>
        <StarButton labId={lab.id} initialCount={stars} />
      </div>

      {/* header */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <LayersIcon className="size-3" /> {meta.label}
          </Badge>
          <LifecycleBadge state={lab.lifecycle} />
          {lab.isNew && <Badge className="uppercase">New</Badge>}
        </div>
        <h1 className="mt-4 max-w-3xl text-balance font-bold text-3xl leading-tight tracking-display sm:text-4xl">
          {lab.title}
        </h1>
        <p className="mt-3 flex max-w-2xl items-start gap-2 text-muted-foreground text-base leading-relaxed">
          <SparklesIcon className="mt-1 size-4 shrink-0 text-primary" />
          {lab.hook}
        </p>
        {lab.fy27Title && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 font-medium text-muted-foreground text-xs">
            <TagIcon className="size-3.5" /> FY27 name: {lab.fy27Title}
          </p>
        )}
      </div>

      <Separator className="mt-6" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* left */}
        <div className="min-w-0 space-y-8">
          <Section title="Overview">
            <p className="text-foreground/80 text-[15px] leading-relaxed">{lab.overview}</p>
          </Section>

          {(lab.fy26Area || lab.fy26Play || lab.fy27Play) && (
            <Section title="FY26 → FY27 solution mapping">
              <Card>
                <CardContent>
                  <p className="mb-4 flex items-center gap-2 text-muted-foreground text-sm">
                    <ShuffleIcon className="size-4 text-primary" />
                    How this lab maps from the FY26 taxonomy to FY27.
                  </p>
                  <FyMapping lab={lab} />
                </CardContent>
              </Card>
            </Section>
          )}

          {lab.modules.length > 0 && (
            <Section title={`What you'll do — ${lab.modules.length} modules`}>
              <ol className="space-y-0">
                {lab.modules.map((m, i) => (
                  <li key={i} className="flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="grid size-8 flex-none place-items-center rounded-full border bg-card font-bold text-primary text-sm">
                        {i + 1}
                      </span>
                      {i < lab.modules.length - 1 && <span className="my-1 w-px flex-1 bg-border" />}
                    </div>
                    <span className="pt-1 font-medium text-[14.5px] leading-snug">{m}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {lab.products.length > 0 && (
            <Section title="Featured products & technologies">
              <div className="flex flex-wrap gap-2">
                {lab.products.map((p) => (
                  <Badge key={p} variant="outline" className="font-normal text-foreground/80">{p}</Badge>
                ))}
              </div>
            </Section>
          )}

          {lab.enhancements && (
            <Section title="Planned for Build 2026">
              <Card className="border-primary/20 bg-primary/[0.04] shadow-none">
                <CardContent className="flex gap-3">
                  <Wand2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="mb-1 font-bold text-primary text-xs uppercase tracking-wide">
                      Proposed enhancement, not yet applied
                    </p>
                    <p className="text-foreground/80 text-sm leading-relaxed">{lab.enhancements}</p>
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}

          {related.length > 0 && (
            <Section title={`More in ${lab.solutionArea}`}>
              <div className="space-y-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/labs/${r.id}`}
                    className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="grid size-9 flex-none place-items-center rounded-lg bg-primary/10 text-primary">
                      <BoxesIcon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[13.5px]">{r.title}</span>
                      <span className="line-clamp-1 text-muted-foreground text-xs">{r.hook}</span>
                    </span>
                    <ChevronRightIcon className="size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* sidebar */}
        <aside className="lg:relative">
          <div className="space-y-4 lg:sticky lg:top-20">
            <Card>
              <CardContent className="space-y-3 text-sm">
                <Fact k="Offering" v={meta.label} />
                <Fact k="FY27 Solution Area" v={String(lab.fy27Area)} />
                {lab.fy27Play && <Fact k="FY27 Solution Play" v={lab.fy27Play} />}
                {lab.level && <Fact k="Level" v={lab.level} />}
                {lab.style && <Fact k="Delivery" v={lab.style} />}
                {lab.durationHours && <Fact k="Access" v={`${lab.durationHours}h`} />}
                <Fact k="Status" v={cfg.label} />
                <Fact k="Modules" v={String(lab.modules.length)} />
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <RefreshCwIcon className="size-3.5" /> Last refreshed
                  </span>
                  <span className="font-semibold">{fmtDate(lab.lastRefresh)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3.5 font-bold text-xl tracking-display">{title}</h2>
      {children}
    </section>
  );
}
