import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { MotionFade } from "@/components/motion-fade";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <MotionFade className="max-w-3xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs text-stone-300">
            <Sparkles className="size-3.5 text-cyan-200" />
            Privacy-first tools for creators
          </div>
          <div className="space-y-5">
            <h1 className="crt-glow max-w-4xl text-5xl font-semibold tracking-normal text-stone-50 sm:text-6xl lg:text-7xl">
              Infinite Tools
            </h1>
            <p className="max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
              Handy little tools for images, audio, video, text, QR codes, and odd retro things. No sign-in, no popups,
              no mystery buttons. Bring a file, get a result, keep moving.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/tools">
                Browse tools
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/privacy">Read the privacy note</Link>
            </Button>
          </div>
        </MotionFade>

        <MotionFade delay={0.08} className="relative">
          <div className="relative overflow-hidden rounded-lg border border-white/12 bg-black/30 p-4 shadow-[0_0_80px_rgba(99,230,226,0.10)]">
            <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="size-2 rounded-full bg-rose-300" />
              <span className="size-2 rounded-full bg-amber-300" />
              <span className="size-2 rounded-full bg-cyan-300" />
              <span className="mono ml-auto text-xs text-stone-500">late-night session</span>
            </div>
            <div className="grid gap-3">
              {[
                ["drop image", "clean it up", "private"],
                ["paste hashtags", "tidy list", "instant"],
                ["trim audio", "save a clip", "local"],
                ["render CRT text", "download png", "glow"]
              ].map((row) => (
                <div
                  key={row[0]}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-white/10 bg-white/[0.045] px-3 py-3 text-sm"
                >
                  <span className="text-stone-200">{row[0]}</span>
                  <span className="text-stone-500">{row[1]}</span>
                  <span className="mono text-cyan-100">{row[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </MotionFade>
      </div>
    </section>
  );
}
