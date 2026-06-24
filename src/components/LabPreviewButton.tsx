import { PlayCircle, ExternalLink, Lock, Clock } from "lucide-react";

/**
 * Links out to the external lab-guide preview. When no URL is configured yet
 * (previewUrl === null) it renders a clear placeholder instead of a dead link,
 * so the slot is ready the moment guide URLs are supplied. For tracks that are
 * still being built (comingSoon), it says so rather than promising a link.
 */
export function LabPreviewButton({ url, title, comingSoon = false }: { url: string | null; title: string; comingSoon?: boolean }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-center gap-2.5 rounded-[16px] aurora-fill px-5 py-4 text-[15px] font-bold text-white shadow-[var(--shadow-glow)] transition-all hover:brightness-105 hover:shadow-[0_16px_40px_rgba(79,70,229,0.42)]"
        aria-label={`Preview the lab guide for ${title}`}
      >
        <PlayCircle className="h-5 w-5" />
        Preview the lab guide
        <ExternalLink className="h-4 w-4 opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    );
  }
  if (comingSoon) {
    return (
      <div className="rounded-[16px] border border-dashed border-violet/30 bg-violet/5 p-4 text-center">
        <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-violet/10">
          <Clock className="h-5 w-5 text-violet" />
        </span>
        <p className="text-[13.5px] font-bold text-ink">Lab guide preview, coming soon</p>
        <p className="mt-0.5 text-[12.5px] text-mut">This track is still being built. Its guide preview will appear here once the lab is ready.</p>
      </div>
    );
  }
  return (
    <div className="rounded-[16px] border border-dashed border-line bg-surface p-4 text-center">
      <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-line2">
        <Lock className="h-5 w-5 text-faint" />
      </span>
      <p className="text-[13.5px] font-bold text-ink">Lab guide preview</p>
      <p className="mt-0.5 text-[12.5px] text-mut">A walkthrough link for this lab will be available here soon.</p>
    </div>
  );
}
