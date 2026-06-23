import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "Set your password, Microsoft Sandbox" };

export default async function ResetPasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <ResetForm username={session.username} firstTime={session.mustReset} />;
}
