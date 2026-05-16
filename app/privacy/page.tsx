import type { Metadata } from "next";

import { siteUrl } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Privacy",
  description: "The Infinite Tools privacy note: no account required, local processing where possible, and no creepy tracking.",
  alternates: {
    canonical: `${siteUrl}/privacy`
  }
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="mono mb-2 text-xs uppercase tracking-[0.28em] text-cyan-100/80">Privacy</p>
      <h1 className="mb-6 text-4xl font-semibold text-stone-50 sm:text-5xl">No account. No weird file hoarding.</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["On your device when possible", "Image, text, QR, UUID, hash, and many audio checks happen in your browser."],
          ["Bigger media stays simple", "Converters and trimmers load a local browser tool for audio and video work."],
          ["No forced analytics", "The platform is built to work without invasive session recording or cross-site tracking."],
          ["Clear downloads", "Generated results are offered as direct browser downloads. No fake countdowns, no traps."]
        ].map(([title, text]) => (
          <section key={title} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="mb-2 text-lg font-semibold text-stone-50">{title}</h2>
            <p className="text-sm leading-6 text-stone-400">{text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
