import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Tiny persistent JSON store with a pluggable backend.
 *
 *  - Azure Blob Storage when AZURE_STORAGE_CONNECTION_STRING is set: one JSON
 *    blob per collection in a single container. This is the centralized,
 *    cost-controlled store for the deployed app (mutable data lives here, not
 *    baked into the build or stranded in a browser's localStorage).
 *  - Local filesystem otherwise (./.data, or /home/data on App Service): the
 *    zero-setup path for local development.
 *
 * Both expose the same readJson / writeJson / mutate API, and writes are
 * serialized per collection through an in-process mutex, which is safe for the
 * single-instance deployment. Swap the backend without touching repositories.
 */

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const CONTAINER = process.env.SANDBOX_BLOB_CONTAINER || "sandbox-data";
const USE_BLOB = CONN.length > 0;

export const DATA_DIR =
  process.env.SANDBOX_DATA_DIR ||
  (process.env.WEBSITE_SITE_NAME ? "/home/data" : path.join(process.cwd(), ".data"));

export const STORAGE_BACKEND: "blob" | "file" = USE_BLOB ? "blob" : "file";

const locks = new Map<string, Promise<unknown>>();

/** Serialize async work per key so concurrent writers never interleave. */
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(key, next.then(() => undefined, () => undefined));
  return next;
}

/* ── Azure Blob backend (lazy-loaded so the file path needs no SDK) ───────── */

let containerPromise: Promise<import("@azure/storage-blob").ContainerClient> | null = null;
async function container() {
  if (!containerPromise) {
    containerPromise = (async () => {
      const { BlobServiceClient } = await import("@azure/storage-blob");
      const svc = BlobServiceClient.fromConnectionString(CONN);
      const c = svc.getContainerClient(CONTAINER);
      await c.createIfNotExists();
      return c;
    })();
  }
  return containerPromise;
}

async function blobRead<T>(name: string, fallback: T): Promise<T> {
  const blob = (await container()).getBlockBlobClient(`${name}.json`);
  try {
    const buf = await blob.downloadToBuffer();
    return JSON.parse(buf.toString("utf8")) as T;
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) return fallback;
    throw err;
  }
}

async function blobWrite<T>(name: string, value: T): Promise<void> {
  const blob = (await container()).getBlockBlobClient(`${name}.json`);
  const body = JSON.stringify(value, null, 2);
  await blob.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: "application/json" },
  });
}

/* ── Filesystem backend ───────────────────────────────────────────────────── */

const fileFor = (name: string) => path.join(DATA_DIR, `${name}.json`);

async function fileRead<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(fileFor(name), "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function fileWrite<T>(name: string, value: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = fileFor(name) + `.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, fileFor(name));
}

/* ── Public API (backend-agnostic) ────────────────────────────────────────── */

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  return USE_BLOB ? blobRead(name, fallback) : fileRead(name, fallback);
}

export async function writeJson<T>(name: string, value: T): Promise<void> {
  await withLock(name, () => (USE_BLOB ? blobWrite(name, value) : fileWrite(name, value)));
}

/** Read-modify-write a collection atomically under one lock. */
export async function mutate<T>(
  name: string,
  fallback: T,
  fn: (current: T) => T | Promise<T>
): Promise<T> {
  return withLock(name, async () => {
    const current = USE_BLOB ? await blobRead(name, fallback) : await fileRead(name, fallback);
    const updated = await fn(current);
    if (USE_BLOB) await blobWrite(name, updated);
    else await fileWrite(name, updated);
    return updated;
  });
}
