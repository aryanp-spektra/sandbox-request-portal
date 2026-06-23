import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getSecretKey } from "./secret";
import type { SessionUser } from "./types";

const COOKIE = "sandbox_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSessionToken(user: SessionUser): Promise<string> {
  const key = await getSecretKey();
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function setSession(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const key = await getSecretKey();
    const { payload } = await jwtVerify(token, key);
    return {
      uid: payload.uid as string,
      username: payload.username as string,
      email: payload.email as string,
      role: payload.role as SessionUser["role"],
      mustReset: Boolean(payload.mustReset),
    };
  } catch {
    return null;
  }
}
