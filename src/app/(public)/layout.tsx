import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-marketing-bg text-marketing-fg font-display-headings">
      <MarketplaceHeader />
      <div className="flex-1">{children}</div>
      <MarketplaceFooter />
    </div>
  );
}
