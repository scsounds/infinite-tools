import type { Metadata } from "next";

import { CategoryCard } from "@/components/category-card";
import { ToolSearch } from "@/components/tools/tool-search";
import { categories, siteUrl, tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Tools Directory",
  description: "Browse all Infinite Tools utilities for images, audio, video, creator workflows, retro graphics, and checksums.",
  alternates: {
    canonical: `${siteUrl}/tools`
  }
};

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 max-w-3xl">
        <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-cyan-100/80">Tool Directory</p>
        <h1 className="mb-4 text-4xl font-semibold text-stone-50 sm:text-5xl">Pick the small machine you need.</h1>
        <p className="text-sm leading-7 text-stone-400">
          Every utility is designed to be direct, private, and legible. Drag in a file, paste text, get the result, leave.
        </p>
      </section>
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </section>
      <ToolSearch tools={tools} />
    </main>
  );
}
