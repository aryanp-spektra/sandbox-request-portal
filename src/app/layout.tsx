import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({ subsets: ["latin"], variable: "--font-lato", weight: ["300", "400", "700", "900"] });

export const metadata: Metadata = {
  title: "Sandbox Portal, Microsoft Sandbox by CloudLabs",
  description:
    "The self-service catalog and automated voucher fulfillment portal for the Microsoft Sandbox program.",
  icons: {
    icon: "/site-icon-512.webp",
    shortcut: "/site-icon-512.webp",
    apple: "/site-icon-512.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${lato.variable} h-full antialiased`}
    >
      <head>
        {/* set theme before paint to avoid a flash of the wrong mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sbx-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}document.documentElement.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
