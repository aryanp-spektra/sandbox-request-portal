import { LifeBuoyIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Support, Microsoft Sandbox",
  description: "Get help with the Microsoft Sandbox catalog, vouchers and delivery.",
};

const SUPPORT_URL = "https://support.cloudlabs.ai/";

export default function SupportPage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <span className="flex size-12 items-center justify-center rounded-2xl border bg-primary/5 text-primary">
        <LifeBuoyIcon className="size-6" />
      </span>
      <h1 className="mt-5 font-bold text-3xl tracking-display sm:text-4xl">How can we help?</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Open a ticket, track its status and browse known issues with the CloudLabs support team.
      </p>
      <Button asChild size="lg" className="mt-7">
        <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
          Contact support <ExternalLinkIcon className="size-4" />
        </a>
      </Button>
    </main>
  );
}
