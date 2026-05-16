import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/tools";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap"
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Infinite Tools - Fast Creator Utilities",
    template: "%s - Infinite Tools"
  },
  description:
    "A calm collection of image, audio, video, creator, retro, and utility tools built by Infinite Guest.",
  applicationName: "Infinite Tools",
  authors: [{ name: brand.builderName }],
  creator: brand.builderName,
  publisher: brand.umbrellaName,
  openGraph: {
    title: "Infinite Tools",
    description: "Fast, useful creator utilities with local-first processing and no forced accounts.",
    url: siteUrl,
    siteName: "Infinite Tools",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Infinite Tools",
    description: "Fast, useful creator utilities with local-first processing and no forced accounts."
  },
  alternates: {
    canonical: siteUrl
  }
};

export const viewport: Viewport = {
  themeColor: "#08090d",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className="grain" aria-hidden="true" />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
