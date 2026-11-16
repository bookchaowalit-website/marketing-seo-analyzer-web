import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// The font variables sit on <html>: the Dashboard shell tokens live on :root and read them from there.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SEO Check | Bookchaowalit",
  description: "Paste an HTML snapshot and read six basic on-page SEO checks. Runs in the browser, no crawl.",
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  metadataBase: new URL("https://seo-analyzer.bookchaowalit.com"),
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Analytics />
        <SpeedInsights />
        {children}
      </body>
    </html>
  );
}
