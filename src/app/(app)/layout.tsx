import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Nav } from "@/components/shell/Nav";
import { Footer } from "@/components/shell/Footer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustReset) redirect("/reset-password");

  return (
    <>
      <Nav user={session} />
      <div className="min-h-[calc(100vh-180px)]">{children}</div>
      <Footer />
    </>
  );
}
