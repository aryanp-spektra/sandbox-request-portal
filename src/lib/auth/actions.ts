"use server";

import { redirect } from "next/navigation";
import { findByUsername, setPassword, createUser as repoCreate } from "@/lib/data/users";
import { verifyPassword, hashPassword, generateTempPassword } from "./password";
import { setSession, getSession, clearSession } from "./session";
import type { Role } from "./types";

export interface FormState {
  error?: string;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };

  const user = await findByUsername(username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid username or password." };
  }

  await setSession({
    uid: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    mustReset: user.mustReset,
  });
  redirect(user.mustReset ? "/reset-password" : "/portal");
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const hash = await hashPassword(password);
  await setPassword(session!.uid, hash);
  await setSession({ ...session!, mustReset: false });
  redirect("/portal");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}

export interface CreatedUser {
  username: string;
  email: string;
  role: Role;
  tempPassword: string;
}

export async function createUserAction(input: {
  username: string;
  email: string;
  role: Role;
}): Promise<CreatedUser> {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Not authorized.");
  if (!input.username.trim() || !input.email.trim()) {
    throw new Error("Username and email are both required.");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const user = await repoCreate({
    username: input.username,
    email: input.email,
    role: input.role,
    passwordHash,
    createdBy: session.username,
  });
  return { username: user.username, email: user.email, role: user.role, tempPassword };
}
