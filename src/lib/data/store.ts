import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Tiny persistent JSON store.
 *
 * Resolves to App Service's persistent /home/data on Azure (detected via
 * WEBSITE_SITE_NAME) and ./.data locally. Writes are atomic (temp file +
 * rename) and serialized per file through an in-process mutex, which is safe
 * for the single-instance deployment. Swap this module for a real database
 * later without touching the repositories that consume it.
 */

export const DATA_DIR =
  process.env.SANDBOX_DATA_DIR ||
  (process.env.WEBSITE_SITE_NAME ? "/home/data" : path.join(process.cwd(), ".data"));

const locks = new Map<string, Promise<unknown>>();

/** Serialize async work per key so concurrent writers never interleave. */
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(
    key,
    next.then(
      () => undefined,
      () => undefined
    )
  );
  return next;
}

function fileFor(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(fileFor(name), "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

export async function writeJson<T>(name: string, value: T): Promise<void> {
  await withLock(name, async () => {
    await ensureDir();
    const tmp = fileFor(name) + `.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
    await fs.rename(tmp, fileFor(name));
  });
}

/** Read-modify-write a collection atomically under one lock. */
export async function mutate<T>(
  name: string,
  fallback: T,
  fn: (current: T) => T | Promise<T>
): Promise<T> {
  return withLock(name, async () => {
    await ensureDir();
    const current = await readJson<T>(name, fallback);
    const updated = await fn(current);
    const tmp = fileFor(name) + `.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(updated, null, 2), "utf8");
    await fs.rename(tmp, fileFor(name));
    return updated;
  });
}
