import { MarketplaceShell } from "@/components/marketplace/MarketplaceShell";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-ambient bg-marketing-bg text-marketing-fg font-display-headings">
      <MarketplaceShell footer={<MarketplaceFooter />}>{children}</MarketplaceShell>
    </div>
  );
}
