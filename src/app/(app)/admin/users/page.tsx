import { listUsers } from "@/lib/data/users";
import { UsersClient } from "./UsersClient";

export const metadata = { title: "Users, Sandbox admin" };

export default async function UsersPage() {
  const users = await listUsers();
  return <UsersClient users={users} />;
}
