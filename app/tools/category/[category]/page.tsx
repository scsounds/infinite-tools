import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ToolCard } from "@/components/tool-card";
import { categories, getCategory, getToolsByCategory, siteUrl } from "@/lib/tools";
import type { ToolCategoryId } from "@/types/tools";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categoryId } = await params;
  const category = getCategory(categoryId);
  if (!category) return {};

  return {
    title: category.title,
    description: category.description,
    alternates: {
      canonical: `${siteUrl}/tools/category/${category.id}`
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categoryId } = await params;
  const category = getCategory(categoryId);
  if (!category) notFound();

  const categoryTools = getToolsByCategory(category.id as ToolCategoryId);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 max-w-3xl">
        <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-cyan-100/80">Category</p>
        <h1 className="mb-4 text-4xl font-semibold text-stone-50 sm:text-5xl">{category.title}</h1>
        <p className="text-sm leading-7 text-stone-400">{category.description}</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryTools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </main>
  );
}
