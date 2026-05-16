import Link from "next/link";
import { ArrowRight, AudioLines, Film, Sparkles, Wand2 } from "lucide-react";

import { CategoryCard } from "@/components/category-card";
import { Hero } from "@/components/home/hero";
import { MotionFade } from "@/components/motion-fade";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { musicLinks } from "@/lib/brand";
import { categories, featuredTools } from "@/lib/tools";

const editRows = [
  { title: "analyze song", detail: "BPM / beats / sections", icon: AudioLines },
  { title: "sequence clips", detail: "beat-snapped timeline", icon: Film },
  { title: "apply grammar", detail: "dubstep / lofi / phonk", icon: Wand2 }
];

export default function HomePage() {
  return (
    <main>
      <Hero />
      <section className="border-b border-white/10 bg-black/18">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <MotionFade className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1 text-xs text-cyan-100">
              <Sparkles className="size-3.5" />
              New workspace
            </div>
            <div>
              <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-rose-100/80">Infinite Edits</p>
              <h2 className="max-w-2xl text-3xl font-semibold text-stone-50 sm:text-4xl">
                A music-reactive editor growing inside the tool shelf.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-stone-400">
                Import a song and visuals, map the beat grid, choose an editing grammar, then generate a first cut with
                timeline blocks and live WebGL FX. It is already interactive.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/infinite-edits">
                Open Infinite Edits
                <ArrowRight />
              </Link>
            </Button>
          </MotionFade>

          <MotionFade delay={0.08}>
            <Link
              href="/infinite-edits"
              className="group block overflow-hidden rounded-lg border border-white/12 bg-white/[0.04] transition hover:border-cyan-300/35"
            >
              <div className="border-b border-white/10 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-300" />
                  <span className="size-2 rounded-full bg-amber-300" />
                  <span className="size-2 rounded-full bg-cyan-300" />
                  <span className="mono ml-auto text-xs text-stone-500">reactive edit engine</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {editRows.map(({ title, detail, icon: Icon }) => (
                    <div key={title} className="rounded-md border border-white/10 bg-black/24 p-3">
                      <Icon className="mb-3 size-5 text-cyan-100" />
                      <p className="text-sm font-medium text-stone-100">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-44 overflow-hidden bg-black/30">
                <div className="absolute inset-x-6 top-10 h-1 rounded-full bg-cyan-300/40 shadow-[0_0_24px_rgba(99,230,226,0.42)]" />
                <div className="absolute left-6 right-6 top-16 grid gap-2">
                  {[0, 1].map((track) => (
                    <div key={track} className="relative h-12 rounded border border-white/8 bg-white/[0.03]">
                      {[0, 1, 2, 3].map((clip) => (
                        <span
                          key={clip}
                          className="absolute top-2 h-8 rounded border border-cyan-300/25 bg-cyan-300/[0.08] transition group-hover:bg-cyan-300/[0.13]"
                          style={{
                            left: `${clip * 24 + track * 7}%`,
                            width: `${18 + ((clip + track) % 2) * 9}%`
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
            </Link>
          </MotionFade>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <MotionFade className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-cyan-100/80">Featured</p>
            <h2 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Useful without making a scene</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone-400">
            Most things happen right here in the browser. Bigger audio and video jobs may take a minute, but they still
            avoid the usual upload-and-hope ritual.
          </p>
        </MotionFade>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-rose-100/80">Directory</p>
            <h2 className="text-2xl font-semibold text-stone-50 sm:text-3xl">Find the thing, use the thing</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-amber-100/80">Infinite Guest</p>
            <h2 className="mb-4 text-2xl font-semibold text-stone-50 sm:text-3xl">
              If these tools helped you, the music might too.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-400">
              Infinite Guest sits under Full Circle Avenue. The tools stay quiet because the tools are the point, but the
              music is right here if you want the other side of the room.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {musicLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-stone-100 transition hover:border-white/20 hover:bg-white/[0.09]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/24 p-5">
            <div className="mono grid gap-2 text-sm text-stone-400">
              <span>no autoplay</span>
              <span>no forced account</span>
              <span>no fake urgency</span>
              <span className="text-cyan-100">Infinite Guest / Full Circle Avenue</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
