/**
 * Provider selector. The rest of the app imports from here and stays unaware
 * of which implementation is wired in. Flip these bindings to point at real
 * CloudLabs-backed providers when the integration phase arrives.
 */
export { catalog, readiness, vouchers } from "./mock";
export type {
  CatalogProvider,
  CatalogQuery,
  ReadinessProvider,
  VoucherProvider,
  RequestProvider,
} from "./types";
