import Link from "next/link";

import { Icon } from "@/components/icon";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getToolsByCategory } from "@/lib/tools";
import type { ToolCategory } from "@/types/tools";

export function CategoryCard({ category }: { category: ToolCategory }) {
  const count = getToolsByCategory(category.id).length;

  return (
    <Link href={`/tools/category/${category.id}`} className="group block">
      <Card className="h-full transition duration-300 hover:border-rose-300/30 hover:bg-white/[0.055]">
        <CardHeader>
          <div className="mb-3 flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-md border border-white/12 bg-black/28 text-rose-100">
              <Icon name={category.icon} className="size-5" />
            </span>
            <span className="mono text-xs text-stone-500">{count.toString().padStart(2, "0")}</span>
          </div>
          <CardTitle>{category.title}</CardTitle>
          <CardDescription>{category.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
