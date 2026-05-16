import { clamp, replaceExtension } from "@/lib/utils";

export type ImageFormat = "image/png" | "image/jpeg" | "image/webp";

export type ImageResult = {
  blob: Blob;
  url: string;
  filename: string;
  width: number;
  height: number;
};

export const imageExtensions: Record<ImageFormat, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp"
};

const maxCanvasSide = 12_000;
const maxCanvasPixels = 72_000_000;

export function imageFormatLabel(format: ImageFormat) {
  return imageExtensions[format].toUpperCase();
}

export async function loadBitmap(file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file, { imageOrientation: "from-image" });
}

export async function fileToCanvas(file: File) {
  const bitmap = await loadBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available in this browser.");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return { canvas, width: canvas.width, height: canvas.height };
}

export async function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality = 0.9) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not encode the image."));
        else resolve(blob);
      },
      format,
      clamp(quality, 0.05, 1)
    );
  });
}

export async function convertImage(file: File, format: ImageFormat, quality = 0.9): Promise<ImageResult> {
  const { canvas, width, height } = await fileToCanvas(file);
  if (format === "image/jpeg") {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is not available in this browser.");
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  const blob = await canvasToBlob(canvas, format, quality);
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: replaceExtension(file.name, imageExtensions[format]),
    width,
    height
  };
}

export async function resizeImage(
  file: File,
  width: number,
  height: number,
  format: ImageFormat,
  quality = 0.9
): Promise<ImageResult> {
  const bitmap = await loadBitmap(file);
  const canvas = document.createElement("canvas");
  const target = safeCanvasSize(width, height);
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available in this browser.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await canvasToBlob(canvas, format, quality);

  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: replaceExtension(file.name, imageExtensions[format]),
    width: canvas.width,
    height: canvas.height
  };
}

export async function cropImage(
  file: File,
  crop: { x: number; y: number; width: number; height: number },
  format: ImageFormat,
  quality = 0.9
): Promise<ImageResult> {
  const bitmap = await loadBitmap(file);
  const x = clamp(Math.round(crop.x), 0, bitmap.width - 1);
  const y = clamp(Math.round(crop.y), 0, bitmap.height - 1);
  const width = clamp(Math.round(crop.width), 1, bitmap.width - x);
  const height = clamp(Math.round(crop.height), 1, bitmap.height - y);
  safeCanvasSize(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available in this browser.");
  if (format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
  bitmap.close();
  const blob = await canvasToBlob(canvas, format, quality);

  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: replaceExtension(file.name, imageExtensions[format]),
    width,
    height
  };
}

export async function extractPalette(file: File, colorCount = 8) {
  const bitmap = await loadBitmap(file);
  const size = 120;
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas rendering is not available in this browser.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const pixels = context.getImageData(0, 0, width, height).data;
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

  for (let index = 0; index < pixels.length; index += 16) {
    const alpha = pixels[index + 3];
    if (alpha < 128) continue;
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, colorCount)
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count);
      const g = Math.round(bucket.g / bucket.count);
      const b = Math.round(bucket.b / bucket.count);
      return {
        hex: rgbToHex(r, g, b),
        rgb: `rgb(${r}, ${g}, ${b})`,
        count: bucket.count
      };
    });
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function safeCanvasSize(width: number, height: number) {
  const nextWidth = Math.max(1, Math.round(width));
  const nextHeight = Math.max(1, Math.round(height));
  if (nextWidth > maxCanvasSide || nextHeight > maxCanvasSide || nextWidth * nextHeight > maxCanvasPixels) {
    throw new Error("That output is too large for a browser canvas. Try a smaller width or height.");
  }
  return { width: nextWidth, height: nextHeight };
}
