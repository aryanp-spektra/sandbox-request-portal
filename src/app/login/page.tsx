import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in, Microsoft Sandbox" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.mustReset ? "/reset-password" : "/portal");
  return <LoginForm />;
}
