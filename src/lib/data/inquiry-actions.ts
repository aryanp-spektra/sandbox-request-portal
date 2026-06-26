"use server";

import { addInquiry, type CustomLabInquiry, type NewCustomLabInquiry } from "./inquiries";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Submit a custom-lab request. Anonymous, no session required. */
export async function submitCustomLabAction(input: NewCustomLabInquiry): Promise<CustomLabInquiry> {
  if (!input.topic?.trim()) throw new Error("Please describe the lab you need.");
  if (!input.name?.trim()) throw new Error("Please enter your name.");
  if (!EMAIL_RE.test((input.email ?? "").trim())) throw new Error("Please enter a valid email.");
  return addInquiry(input);
}
