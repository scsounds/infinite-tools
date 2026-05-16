import type { Metadata } from "next";
import Link from "next/link";
import { Music2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { brand, musicLinks } from "@/lib/brand";
import { siteUrl } from "@/lib/tools";

export const metadata: Metadata = {
  title: "About",
  description: "About Infinite Tools, Infinite Guest, and Full Circle Avenue.",
  alternates: {
    canonical: `${siteUrl}/about`
  }
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-cyan-100/80">About</p>
      <h1 className="mb-6 text-4xl font-semibold text-stone-50 sm:text-5xl">Useful tools, made by a real person.</h1>
      <div className="space-y-6 text-sm leading-7 text-stone-400">
        <p>
          Infinite Tools is a collection of creator utilities built around speed, privacy, and a little bit of late-night
          internet atmosphere. The goal is simple: help someone finish the tiny annoying task in front of them.
        </p>
        <p>
          Most tools run fully in your browser. Heavier audio and video jobs use a local media tool when possible, so
          your files do not need to be shipped away just to be converted, trimmed, or cleaned.
        </p>
      </div>

      <section id="music" className="mt-12 rounded-lg border border-white/10 bg-white/[0.035] p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
            <Music2 className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-stone-50">Built by {brand.builderName}</h2>
            <p className="text-sm text-stone-500">
              {brand.tagline} Infinite Guest is part of {brand.umbrellaName}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {musicLinks.map((item) => (
            <Button key={item.href} asChild variant="secondary">
              <Link href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>
    </main>
  );
}
