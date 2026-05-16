import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
      <div>
        <p className="mono mb-3 text-xs uppercase tracking-[0.28em] text-cyan-100/80">404</p>
        <h1 className="mb-4 text-4xl font-semibold text-stone-50">That tool is not on the shelf.</h1>
        <p className="mb-6 text-sm leading-7 text-stone-400">The link may be old, mistyped, or from a future build.</p>
        <Button asChild>
          <Link href="/tools">Browse tools</Link>
        </Button>
      </div>
    </main>
  );
}
