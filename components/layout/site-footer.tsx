import Link from "next/link";

import { musicLinks } from "@/lib/brand";
import { categories } from "@/lib/tools";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-stone-100">Infinite Tools</p>
          <p className="max-w-md text-sm leading-6 text-stone-400">
            Simple creator utilities that try to stay out of the way.
          </p>
          <p className="text-sm text-stone-500">Built by Infinite Guest, under Full Circle Avenue.</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">Categories</p>
          <div className="grid gap-2 text-sm text-stone-300">
            {categories.slice(0, 4).map((category) => (
              <Link key={category.id} href={`/tools/category/${category.id}`} className="hover:text-cyan-100">
                {category.title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">Quiet Corners</p>
          <div className="grid gap-2 text-sm text-stone-300">
            <Link href="/privacy" className="hover:text-cyan-100">
              Privacy
            </Link>
            <Link href="/about" className="hover:text-cyan-100">
              About
            </Link>
            <Link href="/tools" className="hover:text-cyan-100">
              All tools
            </Link>
            {musicLinks.map((item) => (
              <Link key={item.href} href={item.href} target="_blank" rel="noreferrer" className="hover:text-cyan-100">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
