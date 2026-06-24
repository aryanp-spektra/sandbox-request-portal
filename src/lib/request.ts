/**
 * Voucher request routing.
 *
 * Live voucher generation needs a CloudLabs release, so until that lands a
 * request is routed to the CloudLabs support inbox as a prefilled email. The
 * requester portal collects a minimal set of details (quantity, when they are
 * needed by, and any custom requirements) and this module turns them into the
 * email. The real issuing API can later replace the mailto unchanged.
 */
import type { Lab } from "./types";

/** Support distribution list the voucher requests are routed to. */
export const SUPPORT_EMAIL = "cloudlabs-support@spektrasystems.com";

export interface VoucherRequestDetails {
  quantity: number;
  /** The customer / organization the vouchers are for. */
  customerName: string;
  /** ISO date the requester needs the vouchers by (ETA), or "". */
  neededBy: string;
  /** Free-text custom requirements, e.g. duration changes (optional). */
  customRequirements: string;
  requesterName: string;
  requesterOrg: string;
}

function bodyLines(lab: Lab, d: VoucherRequestDetails): string[] {
  const lines = [
    "Hi CloudLabs Support team,",
    "",
    "Please action the following voucher request from the Microsoft Sandbox portal.",
    "",
    `Lab: ${lab.title}`,
    `Lab ID: ${lab.id}`,
    `Offering type: ${lab.typeLabel}`,
    `FY27 solution area: ${lab.fy27Area}`,
    lab.fy27Play ? `FY27 solution play: ${lab.fy27Play}` : null,
    lab.level ? `Level: ${lab.level}` : null,
    "",
    `Requested by: ${d.requesterName}`,
    `Organization: ${d.requesterOrg}`,
    d.customerName.trim() ? `Customer: ${d.customerName.trim()}` : null,
    `Vouchers needed: ${d.quantity}`,
    d.neededBy ? `Needed by: ${d.neededBy}` : null,
    d.customRequirements.trim() ? `Custom requirements: ${d.customRequirements.trim()}` : null,
    "",
    "(Add any further details below before sending.)",
    "",
    "Thank you,",
    d.requesterName,
  ];
  return lines.filter((l): l is string => l !== null);
}

/** mailto: href that opens a prefilled, fully-detailed voucher request. */
export function voucherRequestMailto(lab: Lab, d: VoucherRequestDetails): string {
  const subject = `Voucher request: ${lab.title} (${d.quantity} x, ${lab.id})`;
  const body = bodyLines(lab, d).join("\n");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
