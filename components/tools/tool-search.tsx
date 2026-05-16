"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ToolCard } from "@/components/tool-card";
import { Input } from "@/components/ui/input";
import type { Tool } from "@/types/tools";

export function ToolSearch({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tools;
    return tools.filter((tool) =>
      [tool.title, tool.description, tool.category, ...tool.tags].join(" ").toLowerCase().includes(term)
    );
  }, [query, tools]);

  return (
    <div className="space-y-6">
      <label className="relative block">
        <span className="sr-only">Search tools</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search converters, compressors, counters..."
          className="h-12 pl-10"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
      {results.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.035] p-5 text-sm text-stone-400">
          Nothing matched that search. The shelf is still growing.
        </p>
      ) : null}
    </div>
  );
}
