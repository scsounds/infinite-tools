import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { ToolRenderer } from "@/apps/tools/tool-renderer";
import { ToolCard } from "@/components/tool-card";
import { getRelatedTools, getTool, siteUrl, tools, toolUrl } from "@/lib/tools";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  return {
    title: tool.title,
    description: tool.description,
    alternates: {
      canonical: toolUrl(tool.slug)
    },
    openGraph: {
      title: `${tool.title} - Infinite Tools`,
      description: tool.description,
      url: toolUrl(tool.slug),
      type: "website"
    },
    twitter: {
      card: "summary",
      title: `${tool.title} - Infinite Tools`,
      description: tool.description
    }
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const related = getRelatedTools(tool);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url: `${siteUrl}/tools/${tool.slug}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    creator: {
      "@type": "Organization",
      name: "Infinite Guest",
      parentOrganization: {
        "@type": "Organization",
        name: "Full Circle Avenue"
      }
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
        }}
      />
      <section className="mb-8 max-w-4xl">
        <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-cyan-100/80">{tool.category} tool</p>
        <h1 className="mb-4 text-4xl font-semibold text-stone-50 sm:text-5xl">{tool.title}</h1>
        <p className="max-w-3xl text-sm leading-7 text-stone-400">{tool.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-stone-400">
            <ShieldCheck className="size-3.5 text-cyan-100" />
            {tool.privacy === "local" ? "Works on this device" : "No upload for media work"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-stone-400">
            No login required
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-stone-400">
            Save when ready
          </span>
        </div>
      </section>

      <ToolRenderer tool={tool} />

      {related.length ? (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-semibold text-stone-50">Related tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ToolCard key={item.slug} tool={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
