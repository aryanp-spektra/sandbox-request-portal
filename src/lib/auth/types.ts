export type Role = "admin" | "requester";

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  passwordHash: string;
  /** true until the user sets their own password (first login / admin-created) */
  mustReset: boolean;
  createdAt: string;
  createdBy: string | null;
}

/** The claims carried in the session cookie. Never includes the hash. */
export interface SessionUser {
  uid: string;
  username: string;
  email: string;
  role: Role;
  mustReset: boolean;
}
