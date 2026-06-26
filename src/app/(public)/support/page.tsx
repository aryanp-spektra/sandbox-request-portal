import Link from "next/link";
import { LifeBuoyIcon, MailIcon, ExternalLinkIcon, SparklesIcon, BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RequestCustomLab } from "@/components/marketplace/RequestCustomLab";

export const metadata = {
  title: "Support — Microsoft Sandbox",
  description: "Get help with the Microsoft Sandbox catalog, vouchers and custom lab requests.",
};

const SUPPORT_EMAIL = "sandbox-support@spektrasystems.com";
// TODO: point this at your standalone CloudLabs support portal URL once confirmed.
const SUPPORT_PORTAL_URL = "https://help.cloudlabs.ai";

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border bg-primary/5 text-primary">
          <LifeBuoyIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-bold text-3xl tracking-display sm:text-4xl">How can we help?</h1>
        <p className="mt-3 text-muted-foreground">
          Get help with the Microsoft Sandbox catalog, voucher requests and delivery — or ask us to build a lab you can&apos;t find.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
        <Card>
          <CardContent className="flex h-full flex-col">
            <span className="flex size-10 items-center justify-center rounded-xl border bg-primary/5 text-primary">
              <LifeBuoyIcon className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold">Support portal</h2>
            <p className="mt-1.5 flex-1 text-muted-foreground text-sm leading-relaxed">
              Open a ticket, track its status and browse known issues in the CloudLabs support portal.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
              <a href={SUPPORT_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                Open support portal <ExternalLinkIcon className="size-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col">
            <span className="flex size-10 items-center justify-center rounded-xl border bg-primary/5 text-primary">
              <MailIcon className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold">Email the team</h2>
            <p className="mt-1.5 flex-1 text-muted-foreground text-sm leading-relaxed">
              Prefer email? Reach the Sandbox team directly and we&apos;ll reply within one business day.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col">
            <span className="flex size-10 items-center justify-center rounded-xl border bg-primary/5 text-primary">
              <SparklesIcon className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold">Request a custom lab</h2>
            <p className="mt-1.5 flex-1 text-muted-foreground text-sm leading-relaxed">
              Can&apos;t find the lab you need? Tell us the topic and we&apos;ll scope a sandbox for your engagement.
            </p>
            <RequestCustomLab variant="outline" size="sm" className="mt-4 w-fit" label="Request a lab" />
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto mt-8 max-w-4xl">
        <Card className="border-primary/20 bg-primary/[0.04] shadow-none">
          <CardContent className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <BookOpenIcon className="size-5 text-primary" />
              <p className="text-sm">
                New to the catalog? Start by browsing labs across AI, cloud and security.
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/explore">Browse the catalog</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
