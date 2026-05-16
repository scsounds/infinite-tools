import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Icon } from "@/components/icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categories } from "@/lib/tools";
import type { Tool } from "@/types/tools";

export function ToolCard({ tool }: { tool: Tool }) {
  const category = categories.find((item) => item.id === tool.category);

  return (
    <Link href={`/tools/${tool.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.055]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-10 place-items-center rounded-md border border-white/12 bg-black/28 text-cyan-100">
              <Icon name={tool.icon} className="size-5" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-stone-400">
              <ShieldCheck className="size-3" />
              {tool.privacy === "local" ? "Stays here" : "No upload"}
            </span>
          </div>
          <CardTitle>{tool.shortTitle}</CardTitle>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex items-center justify-between pt-2 text-xs text-stone-500">
          <span>{category?.title}</span>
          <span className="inline-flex items-center gap-1 text-cyan-100 opacity-0 transition group-hover:opacity-100">
            Open <ArrowRight className="size-3" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
