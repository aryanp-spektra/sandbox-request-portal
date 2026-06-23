/**
 * Voucher request routing.
 *
 * Live voucher generation needs a CloudLabs release, so until that lands a
 * request is routed to the CloudLabs support inbox as a prefilled email. The
 * requester portal collects the structured details (purpose, quantity, dates)
 * and this module turns them into the email. The real issuing API can later
 * replace the mailto without changing the intake form.
 */
import type { Lab, VoucherPurpose, PlannedDeliveryDetails } from "./types";

/** Support distribution list the voucher requests are routed to. */
export const SUPPORT_EMAIL = "cloudlabs-support@spektrasystems.com";

export interface VoucherRequestDetails {
  quantity: number;
  purpose: VoucherPurpose;
  delivery: PlannedDeliveryDetails | null;
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
    `Purpose: ${d.purpose === "planned-delivery" ? "Planned delivery" : "Self-paced"}`,
    `Vouchers needed: ${d.quantity}`,
  ];
  if (d.purpose === "planned-delivery" && d.delivery) {
    lines.push(
      `Engagement / event: ${d.delivery.engagement}`,
      `Partner / customer: ${d.delivery.partner}`,
      `Dates: ${d.delivery.startDate} to ${d.delivery.endDate}`,
      `Expected attendees: ${d.delivery.expectedAttendees}`
    );
  }
  lines.push("", "Thank you,", d.requesterName);
  return lines.filter((l): l is string => l !== null);
}

/** mailto: href that opens a prefilled, fully-detailed voucher request. */
export function voucherRequestMailto(lab: Lab, d: VoucherRequestDetails): string {
  const subject = `Voucher request: ${lab.title} (${d.quantity} x, ${lab.id})`;
  const body = bodyLines(lab, d).join("\n");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
