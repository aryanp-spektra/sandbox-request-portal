import "server-only";
import { randomUUID } from "node:crypto";
import { readJson, mutate } from "./store";
import { hashPassword } from "@/lib/auth/password";
import type { Role, User } from "@/lib/auth/types";

const COLLECTION = "users";

// Seeded on first run so there is always an admin to sign in as. The initial
// password can be overridden with the ADMIN_SEED_PASSWORD env var (recommended
// in production, since this repo is public); it is forced to change on first
// sign in regardless.
const SEED_ADMIN = {
  username: process.env.ADMIN_SEED_USERNAME || "admin",
  email: process.env.ADMIN_SEED_EMAIL || "admin@spektrasystems.com",
  password: process.env.ADMIN_SEED_PASSWORD || "Sandbox-Admin-2026!",
};

let seeded = false;

export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  await mutate<User[]>(COLLECTION, [], async (users) => {
    if (users.length > 0) return users;
    const passwordHash = await hashPassword(SEED_ADMIN.password);
    return [
      {
        id: randomUUID(),
        username: SEED_ADMIN.username,
        email: SEED_ADMIN.email,
        role: "admin",
        passwordHash,
        mustReset: true,
        createdAt: new Date().toISOString(),
        createdBy: null,
      },
    ];
  });
  seeded = true;
}

export function publicUser(u: User) {
  const { passwordHash: _hash, ...rest } = u;
  void _hash;
  return rest;
}

export async function listUsers(): Promise<Omit<User, "passwordHash">[]> {
  await ensureSeed();
  const users = await readJson<User[]>(COLLECTION, []);
  return users
    .map(publicUser)
    .sort((a, b) => a.username.localeCompare(b.username));
}

export async function findByUsername(username: string): Promise<User | null> {
  await ensureSeed();
  const users = await readJson<User[]>(COLLECTION, []);
  const u = username.trim().toLowerCase();
  return users.find((x) => x.username.toLowerCase() === u) ?? null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  role: Role;
  passwordHash: string;
  createdBy: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  await ensureSeed();
  let created: User | null = null;
  await mutate<User[]>(COLLECTION, [], (users) => {
    const uname = input.username.trim();
    if (users.some((x) => x.username.toLowerCase() === uname.toLowerCase())) {
      throw new Error("A user with that username already exists.");
    }
    created = {
      id: randomUUID(),
      username: uname,
      email: input.email.trim(),
      role: input.role,
      passwordHash: input.passwordHash,
      mustReset: true,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
    };
    return [...users, created];
  });
  return created!;
}

export async function setPassword(userId: string, passwordHash: string): Promise<void> {
  await mutate<User[]>(COLLECTION, [], (users) =>
    users.map((u) =>
      u.id === userId ? { ...u, passwordHash, mustReset: false } : u
    )
  );
}
