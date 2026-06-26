import Link from "next/link";
import { LifeBuoyIcon, ExternalLinkIcon, BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Support — Microsoft Sandbox",
  description: "Get help with the Microsoft Sandbox catalog, vouchers and delivery.",
};

// TODO: point this at your standalone CloudLabs support portal URL once confirmed.
const SUPPORT_PORTAL_URL = "https://help.cloudlabs.ai";

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border bg-primary/5 text-primary">
          <LifeBuoyIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-bold text-3xl tracking-display sm:text-4xl">How can we help?</h1>
        <p className="mt-3 text-muted-foreground">
          Open a ticket, track its status and browse known issues in the CloudLabs support portal —
          our team replies within one business day.
        </p>
        <Button asChild size="lg" className="mt-7">
          <a href={SUPPORT_PORTAL_URL} target="_blank" rel="noopener noreferrer">
            Open the support portal <ExternalLinkIcon className="size-4" />
          </a>
        </Button>
      </div>

      <div className="mx-auto mt-12 max-w-xl">
        <Card className="border-primary/20 bg-primary/[0.04] shadow-none">
          <CardContent className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <BookOpenIcon className="size-5 text-primary" />
              <p className="text-sm">New to the catalog? Start by browsing labs across AI, cloud and security.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/explore">Browse the catalog</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
