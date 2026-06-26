import "server-only";
import { mutate, readJson } from "./store";

/**
 * Custom-lab requests. When a partner can't find a lab in the catalog they
 * describe what they need; the request lands here for the Sandbox team to
 * review (and, later, convert into a real lab). Stored in its own collection
 * so the public form can write to it without touching the auth-gated portal doc.
 */
const COLLECTION = "inquiries";

export interface CustomLabInquiry {
  id: string;
  topic: string;
  platform: string | null;
  deliveryMode: string | null;
  audienceSize: number | null;
  targetDate: string | null;
  name: string;
  email: string;
  organization: string | null;
  requirements: string | null;
  createdAt: string;
}

export interface NewCustomLabInquiry {
  topic: string;
  platform?: string | null;
  deliveryMode?: string | null;
  audienceSize?: number | null;
  targetDate?: string | null;
  name: string;
  email: string;
  organization?: string | null;
  requirements?: string | null;
}

export async function getInquiries(): Promise<CustomLabInquiry[]> {
  return readJson<CustomLabInquiry[]>(COLLECTION, []);
}

export async function addInquiry(input: NewCustomLabInquiry): Promise<CustomLabInquiry> {
  let created: CustomLabInquiry | null = null;
  await mutate<CustomLabInquiry[]>(COLLECTION, [], (list) => {
    created = {
      id: `INQ-${1000 + list.length + 1}`,
      topic: input.topic.trim(),
      platform: input.platform?.trim() || null,
      deliveryMode: input.deliveryMode?.trim() || null,
      audienceSize: input.audienceSize && input.audienceSize > 0 ? Math.floor(input.audienceSize) : null,
      targetDate: input.targetDate?.trim() || null,
      name: input.name.trim(),
      email: input.email.trim(),
      organization: input.organization?.trim() || null,
      requirements: input.requirements?.trim() || null,
      createdAt: new Date().toISOString(),
    };
    return [created!, ...list];
  });
  return created!;
}
