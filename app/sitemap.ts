import type { MetadataRoute } from "next";

import { categories, siteUrl, tools } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    ...["tools", "about", "privacy"].map((path) => ({
      url: `${siteUrl}/${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "tools" ? 0.9 : 0.5
    })),
    ...categories.map((category) => ({
      url: `${siteUrl}/tools/category/${category.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...tools.map((tool) => ({
      url: `${siteUrl}/tools/${tool.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: tool.featured ? 0.9 : 0.75
    }))
  ];
}
