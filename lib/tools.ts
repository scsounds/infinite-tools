import type { Tool, ToolCategory, ToolCategoryId, ToolKind } from "@/types/tools";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://infinite-tools.local";
const rasterImages = "image/jpeg,image/png,image/webp,image/bmp";

export const categories: ToolCategory[] = [
  {
    id: "image",
    title: "Image Tools",
    description: "Convert, compress, resize, crop, strip metadata, and pull palettes in the browser.",
    icon: "Image"
  },
  {
    id: "audio",
    title: "Audio Tools",
    description: "Trim, convert, clean, visualize, and find a tempo without sending your track away.",
    icon: "AudioLines"
  },
  {
    id: "video",
    title: "Video Tools",
    description: "Convert clips, make GIFs, shrink video, and pull audio without account walls.",
    icon: "Clapperboard"
  },
  {
    id: "creator",
    title: "Creator Tools",
    description: "Format descriptions, clean hashtags, count text, and repair timestamp files.",
    icon: "PenTool"
  },
  {
    id: "retro",
    title: "Retro Tools",
    description: "Generate CRT text, VHS subtitles, and tiny web buttons with old-internet texture.",
    icon: "Monitor"
  },
  {
    id: "utility",
    title: "Utility Tools",
    description: "Generate QR codes, UUIDs, and hashes quickly with no sign-in detours.",
    icon: "Wrench"
  }
];

export const tools: Tool[] = [
  {
    slug: "jpg-png-converter",
    title: "JPG <-> PNG Converter",
    shortTitle: "JPG <-> PNG",
    description: "Turn JPG images into PNGs, or PNGs into JPGs, without uploading them.",
    category: "image",
    tags: ["jpg", "png", "convert", "image"],
    accepts: "image/jpeg,image/png",
    privacy: "local",
    featured: true,
    icon: "RefreshCcw"
  },
  {
    slug: "webp-converter",
    title: "WEBP Converter",
    shortTitle: "WEBP",
    description: "Convert images to WEBP, PNG, or JPG directly in your browser.",
    category: "image",
    tags: ["webp", "convert", "image"],
    accepts: rasterImages,
    privacy: "local",
    featured: true,
    icon: "ImagePlus"
  },
  {
    slug: "image-compressor",
    title: "Image Compressor",
    shortTitle: "Compressor",
    description: "Make image files smaller while keeping them good enough to actually use.",
    category: "image",
    tags: ["compress", "image", "jpeg", "webp"],
    accepts: rasterImages,
    privacy: "local",
    featured: true,
    icon: "Archive"
  },
  {
    slug: "image-resizer",
    title: "Image Resizer",
    shortTitle: "Resizer",
    description: "Change an image to the size you need, with the shape kept intact if you want.",
    category: "image",
    tags: ["resize", "image", "scale"],
    accepts: rasterImages,
    privacy: "local",
    icon: "Scaling"
  },
  {
    slug: "image-cropper",
    title: "Image Cropper",
    shortTitle: "Cropper",
    description: "Trim an image down to the part you need and save the result.",
    category: "image",
    tags: ["crop", "image", "canvas"],
    accepts: rasterImages,
    privacy: "local",
    icon: "Crop"
  },
  {
    slug: "metadata-remover",
    title: "Image Metadata Remover",
    shortTitle: "Metadata Remover",
    description: "Remove hidden camera and location details from images when the browser can strip them.",
    category: "image",
    tags: ["metadata", "exif", "privacy", "image"],
    accepts: rasterImages,
    privacy: "local",
    icon: "ShieldOff"
  },
  {
    slug: "color-palette-extractor",
    title: "Color Palette Extractor",
    shortTitle: "Palette Extractor",
    description: "Extract a usable color palette from an image with hex values ready to copy.",
    category: "image",
    tags: ["palette", "color", "hex"],
    accepts: rasterImages,
    privacy: "local",
    featured: true,
    icon: "Palette"
  },
  {
    slug: "bpm-detector",
    title: "BPM Detector",
    shortTitle: "BPM Detector",
    description: "Drop in a track and get a useful BPM estimate to start from.",
    category: "audio",
    tags: ["bpm", "tempo", "audio"],
    accepts: "audio/*",
    privacy: "local",
    featured: true,
    icon: "Activity"
  },
  {
    slug: "audio-converter",
    title: "Audio Converter",
    shortTitle: "Audio Converter",
    description: "Convert audio files to MP3, WAV, OGG, AAC, or FLAC right from the page.",
    category: "audio",
    tags: ["audio", "convert", "mp3", "wav"],
    accepts: "audio/*",
    privacy: "local-heavy",
    icon: "Repeat"
  },
  {
    slug: "audio-trimmer",
    title: "Audio Trimmer",
    shortTitle: "Audio Trimmer",
    description: "Cut a song, sample, or voice note down to the seconds you want.",
    category: "audio",
    tags: ["audio", "trim", "cut"],
    accepts: "audio/*",
    privacy: "local-heavy",
    icon: "Scissors"
  },
  {
    slug: "waveform-visualizer",
    title: "Waveform Visualizer",
    shortTitle: "Waveform",
    description: "Turn an audio file into a clean waveform image you can save as a PNG.",
    category: "audio",
    tags: ["waveform", "audio", "visualizer"],
    accepts: "audio/*",
    privacy: "local",
    icon: "AudioWaveform"
  },
  {
    slug: "audio-metadata-cleaner",
    title: "Audio Metadata Cleaner",
    shortTitle: "Audio Metadata",
    description: "Clear hidden title, artist, album, and tag details from common audio files.",
    category: "audio",
    tags: ["audio", "metadata", "privacy"],
    accepts: "audio/*",
    privacy: "local-heavy",
    icon: "BadgeX"
  },
  {
    slug: "mp4-converter",
    title: "MP4 Converter",
    shortTitle: "MP4 Converter",
    description: "Turn common video files into browser-friendly MP4s.",
    category: "video",
    tags: ["mp4", "video", "convert"],
    accepts: "video/*",
    privacy: "local-heavy",
    icon: "FileVideo"
  },
  {
    slug: "video-compressor",
    title: "Video Compressor",
    shortTitle: "Video Compressor",
    description: "Make video files smaller with a couple of simple quality controls.",
    category: "video",
    tags: ["video", "compress", "mp4"],
    accepts: "video/*",
    privacy: "local-heavy",
    icon: "Minimize2"
  },
  {
    slug: "gif-maker",
    title: "GIF Maker",
    shortTitle: "GIF Maker",
    description: "Turn a short slice of video into a GIF.",
    category: "video",
    tags: ["gif", "video", "maker"],
    accepts: "video/*",
    privacy: "local-heavy",
    featured: true,
    icon: "Film"
  },
  {
    slug: "extract-audio",
    title: "Extract Audio From Video",
    shortTitle: "Extract Audio",
    description: "Pull the sound out of a video and save it as MP3 or WAV.",
    category: "video",
    tags: ["audio", "extract", "video"],
    accepts: "video/*",
    privacy: "local-heavy",
    icon: "Music"
  },
  {
    slug: "youtube-formatter",
    title: "YouTube Title and Description Formatter",
    shortTitle: "YouTube Formatter",
    description: "Clean up titles, chapters, links, credits, and descriptions before you upload.",
    category: "creator",
    tags: ["youtube", "description", "title"],
    accepts: ".txt,text/plain",
    privacy: "local",
    featured: true,
    icon: "Youtube"
  },
  {
    slug: "hashtag-cleaner",
    title: "Hashtag Cleaner",
    shortTitle: "Hashtags",
    description: "Clean repeated, messy hashtag lists into something usable.",
    category: "creator",
    tags: ["hashtags", "social", "clean"],
    accepts: ".txt,text/plain",
    privacy: "local",
    icon: "Hash"
  },
  {
    slug: "character-counter",
    title: "Character Counter",
    shortTitle: "Counter",
    description: "Count characters, words, lines, reading time, and a few useful limits.",
    category: "creator",
    tags: ["characters", "words", "counter"],
    accepts: ".txt,text/plain",
    privacy: "local",
    icon: "WholeWord"
  },
  {
    slug: "subtitle-timestamp-formatter",
    title: "Subtitle Timestamp Formatter",
    shortTitle: "Subtitle Formatter",
    description: "Clean subtitle timestamps and nudge captions forward or backward.",
    category: "creator",
    tags: ["subtitles", "srt", "vtt", "timestamps"],
    accepts: ".srt,.vtt,.txt,text/plain",
    privacy: "local",
    icon: "Subtitles"
  },
  {
    slug: "crt-text-renderer",
    title: "CRT Text Renderer",
    shortTitle: "CRT Text",
    description: "Render glowing terminal-style text to a downloadable PNG.",
    category: "retro",
    tags: ["crt", "text", "retro"],
    accepts: ".txt,text/plain",
    privacy: "local",
    icon: "TerminalSquare"
  },
  {
    slug: "vhs-subtitle-generator",
    title: "VHS Subtitle Generator",
    shortTitle: "VHS Subtitle",
    description: "Make a transparent VHS-style subtitle overlay for edits and clips.",
    category: "retro",
    tags: ["vhs", "subtitle", "retro"],
    accepts: ".txt,text/plain",
    privacy: "local",
    icon: "Captions"
  },
  {
    slug: "retro-button-generator",
    title: "Retro Web Button Generator",
    shortTitle: "Web Button",
    description: "Make a tiny 88x31 web button and grab the image plus HTML snippet.",
    category: "retro",
    tags: ["button", "88x31", "retro"],
    accepts: ".txt,text/plain",
    privacy: "local",
    icon: "Badge"
  },
  {
    slug: "qr-code-generator",
    title: "QR Code Generator",
    shortTitle: "QR Code",
    description: "Generate high-contrast QR codes with SVG and PNG downloads.",
    category: "utility",
    tags: ["qr", "code", "utility"],
    accepts: ".txt,text/plain",
    privacy: "local",
    icon: "QrCode"
  },
  {
    slug: "uuid-generator",
    title: "UUID Generator",
    shortTitle: "UUID",
    description: "Generate random IDs, or make the same ID from the same file every time.",
    category: "utility",
    tags: ["uuid", "guid", "random"],
    accepts: "*/*",
    privacy: "local",
    icon: "Fingerprint"
  },
  {
    slug: "hash-generator",
    title: "Hash and Checksum Generator",
    shortTitle: "Hash Generator",
    description: "Create hashes and checksums for text or files on your device.",
    category: "utility",
    tags: ["hash", "checksum", "sha", "crc32"],
    accepts: "*/*",
    privacy: "local",
    featured: true,
    icon: "KeyRound"
  }
];

export const featuredTools = tools.filter((tool) => tool.featured);

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getCategory(id: string) {
  return categories.find((category) => category.id === id);
}

export function getToolsByCategory(category: ToolCategoryId) {
  return tools.filter((tool) => tool.category === category);
}

export function getRelatedTools(tool: Tool) {
  return tools.filter((item) => item.category === tool.category && item.slug !== tool.slug).slice(0, 3);
}

export function toolUrl(slug: ToolKind) {
  return `${siteUrl}/tools/${slug}`;
}
