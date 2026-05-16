import { replaceExtension } from "@/lib/utils";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import type { fetchFile as fetchFileType } from "@ffmpeg/util";

type FfmpegModules = {
  ffmpeg: FFmpeg;
  fetchFile: typeof fetchFileType;
};

let ffmpegPromise: Promise<FfmpegModules> | null = null;
let activeProgress: ((progress: MediaProgress) => void) | undefined;

export type MediaProgress = {
  message: string;
  progress?: number;
};

export async function getFfmpeg(onProgress?: (progress: MediaProgress) => void): Promise<FfmpegModules> {
  activeProgress = onProgress;
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", ({ message }) => {
        if (message) activeProgress?.({ message });
      });
      ffmpeg.on("progress", ({ progress }) => {
        activeProgress?.({ message: "Working on the file here", progress });
      });
      if (!ffmpeg.loaded) {
        activeProgress?.({ message: "Getting the media tool ready" });
        await ffmpeg.load({
          coreURL: "/ffmpeg/ffmpeg-core.js",
          wasmURL: "/ffmpeg/ffmpeg-core.wasm"
        });
      }
      return { ffmpeg, fetchFile };
    })();
  }

  return await ffmpegPromise!;
}

export async function runFfmpeg(
  file: File,
  args: string[],
  outputName: string,
  mimeType: string,
  onProgress?: (progress: MediaProgress) => void
) {
  activeProgress = onProgress;
  const { ffmpeg, fetchFile } = await getFfmpeg(onProgress);
  const inputName = `input-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  const finalArgs = args.map((arg) => (arg === "$INPUT" ? inputName : arg === "$OUTPUT" ? outputName : arg));
  const code = await ffmpeg.exec(finalArgs);
  if (code !== 0) throw new Error("This browser could not finish that media job.");
  const data = await ffmpeg.readFile(outputName);
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: mimeType });

  await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)]);

  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: outputName
  };
}

export const mediaFormats = {
  audio: {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    aac: "audio/aac",
    flac: "audio/flac"
  },
  video: {
    mp4: "video/mp4",
    gif: "image/gif"
  }
};

export function outputName(file: File, extension: string) {
  return replaceExtension(file.name.replace(/[^\w.-]/g, "_"), extension);
}
