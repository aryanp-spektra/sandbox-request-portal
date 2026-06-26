import Link from "next/link";
import { LifeBuoyIcon, MailIcon, BookOpenIcon, Wand2Icon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORT_EMAIL } from "@/lib/request";

export const metadata = {
  title: "Support — Microsoft Sandbox",
  description: "Get help with the Microsoft Sandbox catalog, vouchers and delivery.",
};

const MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Microsoft Sandbox — support request")}`;

const HELP = [
  {
    icon: BookOpenIcon,
    title: "Browse the catalog",
    body: "Explore every guided lab, hackathon and sandbox across AI, cloud and security.",
    cta: "Open the catalog",
    href: "/explore",
  },
  {
    icon: Wand2Icon,
    title: "Request a custom lab",
    body: "Need something that isn't in the catalog? Tell us the topic, platform and audience.",
    cta: "Start a request",
    href: "/explore",
  },
];

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border bg-primary/5 text-primary">
          <LifeBuoyIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-bold text-3xl tracking-display sm:text-4xl">How can we help?</h1>
        <p className="mt-3 text-muted-foreground">
          Email the Microsoft Sandbox team with a question about the catalog, vouchers or a delivery —
          we reply within one business day.
        </p>
        <Button asChild size="lg" className="mt-7">
          <a href={MAILTO}>
            <MailIcon className="size-4" /> Email the Sandbox team
          </a>
        </Button>
        <p className="mt-3 text-muted-foreground text-xs">{SUPPORT_EMAIL}</p>
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
        {HELP.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="transition-all hover:border-primary/40 hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border bg-primary/5 text-primary">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-semibold text-lg">{item.title}</h2>
                <p className="flex-1 text-muted-foreground text-sm leading-relaxed">{item.body}</p>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 font-medium text-primary text-sm hover:underline"
                >
                  {item.cta} <ArrowRightIcon className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
