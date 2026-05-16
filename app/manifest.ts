import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Infinite Tools",
    short_name: "Infinite Tools",
    description: "Fast, privacy-first creator utilities.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090d",
    theme_color: "#08090d",
    icons: []
  };
}
