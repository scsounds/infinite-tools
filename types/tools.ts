export type ToolCategoryId = "image" | "audio" | "video" | "creator" | "retro" | "utility";

export type ToolKind =
  | "jpg-png-converter"
  | "webp-converter"
  | "image-compressor"
  | "image-resizer"
  | "image-cropper"
  | "metadata-remover"
  | "color-palette-extractor"
  | "bpm-detector"
  | "audio-converter"
  | "audio-trimmer"
  | "waveform-visualizer"
  | "audio-metadata-cleaner"
  | "mp4-converter"
  | "video-compressor"
  | "gif-maker"
  | "extract-audio"
  | "youtube-formatter"
  | "hashtag-cleaner"
  | "character-counter"
  | "subtitle-timestamp-formatter"
  | "crt-text-renderer"
  | "vhs-subtitle-generator"
  | "retro-button-generator"
  | "qr-code-generator"
  | "uuid-generator"
  | "hash-generator";

export type Tool = {
  slug: ToolKind;
  title: string;
  shortTitle: string;
  description: string;
  category: ToolCategoryId;
  tags: string[];
  accepts: string;
  privacy: "local" | "local-heavy";
  featured?: boolean;
  icon: string;
};

export type ToolCategory = {
  id: ToolCategoryId;
  title: string;
  description: string;
  icon: string;
};
