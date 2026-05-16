import type { Metadata } from "next";

import { InfiniteEditsApp } from "@/apps/infinite-edits/infinite-edits-app";
import { siteUrl } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Infinite Edits",
  description:
    "A real music-reactive editing workspace for importing songs and visuals, analyzing beats, generating timelines, and previewing WebGL FX.",
  alternates: {
    canonical: `${siteUrl}/infinite-edits`
  },
  openGraph: {
    title: "Infinite Edits - Infinite Tools",
    description: "Music-reactive editing, beat-synced timelines, preset grammars, and WebGL visual FX.",
    url: `${siteUrl}/infinite-edits`,
    type: "website"
  }
};

export default function InfiniteEditsPage() {
  return (
    <main>
      <InfiniteEditsApp />
    </main>
  );
}
