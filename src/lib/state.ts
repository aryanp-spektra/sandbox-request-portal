/**
 * The unified state model.
 *
 * Reconciles the catalogue's `catalogStatus` with the PRD `lifecycle` and
 * exposes the display + behaviour config the whole UI reads from. Changing how
 * a state looks or behaves happens here, in one place.
 */
import type { CatalogStatus, Lifecycle, LabType } from "./types";

export interface StateConfig {
  label: string;
  /** short tag shown on cards */
  badge: string;
  /** CSS variable names for bg / ink */
  bg: string;
  ink: string;
  /** is a request allowed against a lab in this state? */
  requestable: boolean;
  /** what the rules engine does with a request (see lib/rules.ts) */
  outcome: "instant" | "held" | "blocked" | "coming-soon";
  description: string;
}

export const LIFECYCLE: Record<Lifecycle, StateConfig> = {
  Ready: {
    label: "Ready",
    badge: "Ready",
    bg: "var(--st-ready-bg)",
    ink: "var(--st-ready-ink)",
    requestable: true,
    outcome: "instant",
    description: "Tested, refreshed and active, vouchers issue instantly.",
  },
  InUse: {
    label: "In Use",
    badge: "In Use",
    bg: "var(--st-inuse-bg)",
    ink: "var(--st-inuse-ink)",
    requestable: true,
    outcome: "instant",
    description: "Active vouchers already running for other partners, issues instantly.",
  },
  InTesting: {
    label: "In Testing",
    badge: "Coming soon",
    bg: "var(--st-testing-bg)",
    ink: "var(--st-testing-ink)",
    requestable: false,
    outcome: "coming-soon",
    description: "New track being built and validated, not yet requestable.",
  },
  Stale: {
    label: "Needs validation",
    badge: "Held",
    bg: "var(--st-stale-bg)",
    ink: "var(--st-stale-ink)",
    requestable: true,
    outcome: "held",
    description: "Not recently refreshed, requests are held and routed for validation.",
  },
  Retired: {
    label: "Retired",
    badge: "Retired",
    bg: "var(--st-retired-bg)",
    ink: "var(--st-retired-ink)",
    requestable: false,
    outcome: "blocked",
    description: "Retired from the catalogue, visible but cannot be requested.",
  },
};

export const SOLUTION_AREAS = [
  "AI Business Solutions",
  "Cloud & AI Platforms",
  "Security",
] as const;

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

// Type accents stay within the CloudLabs violet family, distinct shades, one brand.
export const TYPE_META: Record<LabType, { label: string; accent: string; accent2: string }> = {
  "guided-lab": { label: "Guided Lab", accent: "#5b54c4", accent2: "#7d76d8" },
  "gps-skilling": { label: "GPS Skilling", accent: "#6b48c0", accent2: "#8e6fd6" },
  "standard-sandbox": { label: "Standard Sandbox", accent: "#4f3fa8", accent2: "#7060c8" },
  hiad: { label: "Hack in a Day", accent: "#7a4fc0", accent2: "#9c78d8" },
  "hack-to-skill": { label: "Hack to Skill", accent: "#8458c4", accent2: "#a585d8" },
  "hack-to-build": { label: "Hack to Build", accent: "#5d4cb8", accent2: "#7e6dd6" },
};

/** How a catalogue status maps to a lifecycle (the seed applies the same map). */
export const STATUS_TO_LIFECYCLE: Record<CatalogStatus, Lifecycle[]> = {
  Available: ["Ready", "InUse"],
  "Available (Outdated content)": ["Stale"],
  "Available on Demand (Funding Required)": ["Stale"],
  "In Pipeline (Enhancement)": ["Stale"],
  "In Pipeline": ["InTesting"],
  "In Pipeline for July": ["InTesting"],
  "In Pipeline for August": ["InTesting"],
  "In-Pipeline On Demand": ["InTesting"],
  "Archive Now": ["Retired"],
  "Archive Q1 FY27": ["Retired"],
};

export function lifecycleConfig(state: Lifecycle): StateConfig {
  return LIFECYCLE[state];
}
