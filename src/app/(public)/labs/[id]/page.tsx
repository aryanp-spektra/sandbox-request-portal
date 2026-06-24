import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft, Layers, Sparkles, RefreshCw, BarChart3, Boxes, ChevronRight, Wand2,
  Shuffle, Tag,
} from "lucide-react";
import { getLab, LABS } from "@/lib/labs";
import { TYPE_META, lifecycleConfig } from "@/lib/state";
import { LifecycleBadge } from "@/components/ui/LifecycleBadge";
import { FyMapping } from "@/components/FyMapping";
import { RecentRecorder } from "@/components/RecentRecorder";

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
  const related = LABS.filter((l) => l.id !== lab.id && l.solutionArea === lab.solutionArea).slice(0, 4);

  return (
    <main>
      <RecentRecorder id={lab.id} />
      <div className="deep relative overflow-hidden">
        <div className="wrap-wide relative z-10 py-9">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to catalog
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-white backdrop-blur">
              <Layers className="h-3.5 w-3.5" /> {meta.label}
            </span>
            <LifecycleBadge state={lab.lifecycle} />
            {lab.isNew && <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200 backdrop-blur">New</span>}
          </div>

          <h1 className="mt-4 max-w-[860px] font-display text-[clamp(26px,4vw,42px)] font-extrabold leading-tight tracking-tight text-white">
            {lab.title}
          </h1>

          <p className="mt-3 flex items-start gap-2 text-[16px] font-medium leading-relaxed text-cyan-100/90">
            <Sparkles className="mt-1 h-4 w-4 flex-none" />
            {lab.hook}
          </p>

          {lab.fy27Title && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-cyan-100 backdrop-blur">
              <Tag className="h-3.5 w-3.5" />
              FY27 name: {lab.fy27Title}
            </p>
          )}
        </div>
      </div>

      <div className="wrap-wide grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Section title="Overview">
            <p className="text-[15px] leading-relaxed text-slate">{lab.overview}</p>
          </Section>

          {(lab.fy26Area || lab.fy26Play || lab.fy27Play) && (
            <Section title="FY26 to FY27 solution mapping">
              <div className="rounded-[16px] border border-line bg-surface p-5 shadow-soft">
                <p className="mb-4 flex items-center gap-2 text-[13px] text-mut">
                  <Shuffle className="h-4 w-4 text-primary" />
                  How this lab maps from the FY26 taxonomy to FY27.
                </p>
                <FyMapping lab={lab} />
              </div>
            </Section>
          )}

          {lab.modules.length > 0 && (
            <Section title={`What you will do, ${lab.modules.length} modules`}>
              <ol className="space-y-0">
                {lab.modules.map((m, i) => (
                  <li key={i} className="flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line bg-surface text-[13px] font-bold text-primary">{i + 1}</span>
                      {i < lab.modules.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                    </div>
                    <span className="pt-1 text-[14.5px] font-medium leading-snug text-ink">{m}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {lab.products.length > 0 && (
            <Section title="Featured products and technologies">
              <div className="flex flex-wrap gap-2">
                {lab.products.map((p) => (
                  <span key={p} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-slate">{p}</span>
                ))}
              </div>
            </Section>
          )}

          {lab.enhancements && (
            <Section title="Planned for Build 2026">
              <div className="flex gap-3 rounded-[14px] border border-violet/20 bg-violet/5 p-4">
                <Wand2 className="mt-0.5 h-5 w-5 flex-none text-violet" />
                <div>
                  <p className="mb-1 text-[12px] font-bold uppercase tracking-wide text-violet">Proposed enhancement, not yet applied</p>
                  <p className="text-[14px] leading-relaxed text-slate">{lab.enhancements}</p>
                </div>
              </div>
            </Section>
          )}

          {related.length > 0 && (
            <Section title={`More in ${lab.solutionArea}`}>
              <div className="space-y-2">
                {related.map((r) => (
                  <Link key={r.id} href={`/labs/${r.id}`} className="group flex items-center gap-3 rounded-[12px] border border-line bg-surface p-3 transition-all hover:border-[#cdd2e2] hover:shadow-soft">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg text-white" style={{ background: `linear-gradient(135deg,${TYPE_META[r.type].accent},${TYPE_META[r.type].accent2})` }}>
                      <Boxes className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">{r.title}</span>
                      <span className="line-clamp-1 text-[12px] text-faint">{r.hook}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-none text-faint transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* sidebar */}
        <aside className="lg:relative">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-[16px] border border-line bg-surface p-5 shadow-soft">
              <h3 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                <BarChart3 className="h-4 w-4 text-primary" /> At a glance
              </h3>
              <dl className="space-y-3 text-[13.5px]">
                <Fact k="Offering" v={meta.label} />
                <Fact k="FY27 Solution Area" v={String(lab.fy27Area)} />
                {lab.fy27Play && <Fact k="FY27 Solution Play" v={lab.fy27Play} />}
                {lab.level && <Fact k="Level" v={lab.level} />}
                {lab.style && <Fact k="Delivery" v={lab.style} />}
                {lab.durationHours && <Fact k="Access" v={`${lab.durationHours}h`} />}
                <Fact k="Status" v={cfg.label} />
                <Fact k="Modules" v={String(lab.modules.length)} />
                <div className="flex items-center justify-between gap-3 border-t border-line2 pt-3">
                  <span className="flex items-center gap-1.5 text-faint"><RefreshCw className="h-3.5 w-3.5" /> Last refreshed</span>
                  <span className="font-semibold text-ink">{fmtDate(lab.lastRefresh)}</span>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-faint">{k}</dt>
      <dd className="text-right font-semibold text-ink">{v}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="mb-3.5 font-display text-[19px] font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
