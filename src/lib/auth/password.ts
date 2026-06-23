import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** A readable, reasonably strong temporary password for admin-created users. */
export function generateTempPassword(): string {
  const words = ["Cloud", "Sandbox", "Azure", "Fabric", "Copilot", "Spark", "Vault", "Atlas"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  const sym = "!@#$%".charAt(Math.floor(Math.random() * 5));
  return `${w}-${n}${sym}`;
}
