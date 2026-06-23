import "server-only";
import { randomBytes } from "node:crypto";
import { readJson, writeJson } from "@/lib/data/store";

/**
 * Resolve the session-signing secret. Prefers the AUTH_SECRET env var; otherwise
 * generates one once and persists it to the data store so it stays stable across
 * restarts. Verification only happens in Node server code (not Edge), so a
 * file-backed secret is sufficient and needs no manual configuration.
 */
let cached: Uint8Array | null = null;

export async function getSecretKey(): Promise<Uint8Array> {
  if (cached) return cached;
  let secret = process.env.AUTH_SECRET;
  if (!secret) {
    const stored = await readJson<{ secret?: string }>("_auth", {});
    if (stored.secret) {
      secret = stored.secret;
    } else {
      secret = randomBytes(48).toString("hex");
      await writeJson("_auth", { secret });
    }
  }
  cached = new TextEncoder().encode(secret);
  return cached;
}
