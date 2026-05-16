import { CategoryCard } from "@/components/category-card";
import { Hero } from "@/components/home/hero";
import { MotionFade } from "@/components/motion-fade";
import { ToolCard } from "@/components/tool-card";
import { musicLinks } from "@/lib/brand";
import { categories, featuredTools } from "@/lib/tools";

export default function HomePage() {
  return (
    <main>
      <Hero />
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
