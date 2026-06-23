import { Nav } from "@/components/shell/Nav";
import { Footer } from "@/components/shell/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="min-h-[calc(100vh-180px)]">{children}</div>
      <Footer />
    </>
  );
}
