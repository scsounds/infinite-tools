import Link from "next/link";
import { Music2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const nav = [
  { href: "/infinite-edits", label: "Edits" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08090d]/78 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Infinite Tools home">
          <span className="grid size-8 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-[0_0_28px_rgba(99,230,226,0.16)]">
            <span className="mono text-sm">IT</span>
          </span>
          <span className="hidden text-sm font-semibold tracking-wide text-stone-100 sm:inline">Infinite Tools</span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          {nav.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/tools">
              <Search />
              Find a tool
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Full Circle Avenue links"
            className="hidden md:inline-flex"
          >
            <Link href="/about#music">
              <Music2 />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
