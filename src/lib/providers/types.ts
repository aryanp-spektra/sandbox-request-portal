/**
 * Provider interfaces, the integration seam.
 *
 * The UI and rules engine depend only on these interfaces, never on a concrete
 * data source. Today they're backed by a mock reading the seeded FY27
 * catalogue (mock.ts). When CloudLabs / Graph / audit-log APIs become
 * available, a real implementation slots in here with no UI changes.
 */
import type { Lab, Lifecycle, SandboxRequest } from "../types";

export interface CatalogQuery {
  search?: string;
  solutionArea?: string;
  skillArea?: string;
  level?: string;
  type?: string;
  requestableOnly?: boolean;
  lifecycle?: Lifecycle;
}

export interface CatalogProvider {
  list(query?: CatalogQuery): Promise<Lab[]>;
  get(id: string): Promise<Lab | null>;
  /** distinct facet values for building filters */
  facets(): Promise<{
    solutionAreas: string[];
    skillAreas: string[];
    levels: string[];
    types: { id: string; label: string }[];
    products: string[];
  }>;
}

export interface ReadinessProvider {
  /** labs grouped by lifecycle, backs the Lab Readiness Matrix */
  matrix(): Promise<Record<Lifecycle, Lab[]>>;
  /** flip a lab's lifecycle (e.g. mark Ready); returns the updated lab */
  setLifecycle(id: string, next: Lifecycle): Promise<Lab>;
}

export interface VoucherProvider {
  /** generate N voucher codes for a lab */
  issue(labId: string, quantity: number): Promise<string[]>;
}

export interface RequestProvider {
  list(): Promise<SandboxRequest[]>;
  get(id: string): Promise<SandboxRequest | null>;
  create(req: Omit<SandboxRequest, "id">): Promise<SandboxRequest>;
  update(id: string, patch: Partial<SandboxRequest>): Promise<SandboxRequest>;
}
