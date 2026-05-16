"use client";

import { useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Copy,
  Download,
  FileText,
  Hash,
  Image as ImageIcon,
  Loader2,
  Music2,
  RotateCcw,
  Sparkles,
  Wand2
} from "lucide-react";

import { Dropzone } from "@/components/tools/dropzone";
import { OutputCard, type OutputFile, ToolStatus } from "@/components/tools/output-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { estimateBpm, drawWaveform } from "@/lib/processors/audio";
import { crc32, hashBuffer, type HashAlgorithm, uuidFromBytes } from "@/lib/processors/hash";
import {
  convertImage,
  cropImage,
  extractPalette,
  imageExtensions,
  type ImageFormat,
  imageFormatLabel,
  loadBitmap,
  resizeImage
} from "@/lib/processors/image";
import { mediaFormats, outputName, runFfmpeg, type MediaProgress } from "@/lib/processors/media";
import { cleanHashtags, countText, formatYoutubeDescription, shiftSubtitleTimestamps } from "@/lib/processors/text";
import { downloadBlob, formatBytes, readTextFile, replaceExtension } from "@/lib/utils";
import type { Tool } from "@/types/tools";

type ToolRendererProps = {
  tool: Tool;
};

type PaletteColor = Awaited<ReturnType<typeof extractPalette>>[number];

const inputClass =
  "h-10 rounded-md border border-white/12 bg-black/30 px-3 text-sm text-stone-100 focus:border-cyan-300/60 focus:outline-none";

export function ToolRenderer({ tool }: ToolRendererProps) {
  switch (tool.slug) {
    case "jpg-png-converter":
      return <ImageConvertTool tool={tool} mode="jpg-png" />;
    case "webp-converter":
      return <ImageConvertTool tool={tool} mode="webp" />;
    case "image-compressor":
      return <ImageCompressorTool tool={tool} />;
    case "image-resizer":
      return <ImageResizerTool tool={tool} />;
    case "image-cropper":
      return <ImageCropperTool tool={tool} />;
    case "metadata-remover":
      return <ImageMetadataTool tool={tool} />;
    case "color-palette-extractor":
      return <PaletteTool tool={tool} />;
    case "bpm-detector":
      return <BpmTool tool={tool} />;
    case "audio-converter":
      return <AudioConverterTool tool={tool} />;
    case "audio-trimmer":
      return <AudioTrimmerTool tool={tool} />;
    case "waveform-visualizer":
      return <WaveformTool tool={tool} />;
    case "audio-metadata-cleaner":
      return <AudioMetadataTool tool={tool} />;
    case "mp4-converter":
      return <Mp4ConverterTool tool={tool} />;
    case "video-compressor":
      return <VideoCompressorTool tool={tool} />;
    case "gif-maker":
      return <GifMakerTool tool={tool} />;
    case "extract-audio":
      return <ExtractAudioTool tool={tool} />;
    case "youtube-formatter":
      return <YoutubeFormatterTool tool={tool} />;
    case "hashtag-cleaner":
      return <HashtagCleanerTool tool={tool} />;
    case "character-counter":
      return <CharacterCounterTool tool={tool} />;
    case "subtitle-timestamp-formatter":
      return <SubtitleFormatterTool tool={tool} />;
    case "crt-text-renderer":
      return <CrtTextTool tool={tool} />;
    case "vhs-subtitle-generator":
      return <VhsSubtitleTool tool={tool} />;
    case "retro-button-generator":
      return <RetroButtonTool tool={tool} />;
    case "qr-code-generator":
      return <QrTool tool={tool} />;
    case "uuid-generator":
      return <UuidTool tool={tool} />;
    case "hash-generator":
      return <HashTool tool={tool} />;
    default:
      return null;
  }
}

function ToolPanel({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">{children}</div>;
}

function ControlGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.035] p-5">{children}</div>;
}

function OutputStack({ outputs }: { outputs: OutputFile[] }) {
  if (!outputs.length) {
    return (
      <div className="grid min-h-56 place-items-center rounded-lg border border-white/10 bg-black/20 p-6 text-center text-sm text-stone-500">
        Your finished file will show up here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {outputs.map((output) => (
        <OutputCard key={`${output.filename}-${output.blob.size}`} output={output} />
      ))}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {children}
      </select>
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = ""
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="mono text-xs text-stone-500">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-cyan-300"
      />
    </label>
  );
}

function useBusyState() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function begin(messageText: string) {
    setError("");
    setMessage(messageText);
    setBusy(true);
  }

  function fail(cause: unknown) {
    setError(cause instanceof Error ? cause.message : "Something went wrong.");
  }

  function finish(messageText = "Done.") {
    setMessage(messageText);
    setBusy(false);
  }

  return { busy, message, error, begin, fail, finish, setMessage, setBusy };
}

function onMediaProgress(setMessage: (message: string) => void) {
  return (progress: MediaProgress) => {
    const percent = typeof progress.progress === "number" ? ` ${Math.round(progress.progress * 100)}%` : "";
    setMessage(`${progress.message}${percent}`);
  };
}

function ImageConvertTool({ tool, mode }: { tool: Tool; mode: "jpg-png" | "webp" }) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat>(mode === "webp" ? "image/webp" : "image/png");
  const [quality, setQuality] = useState(90);
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const state = useBusyState();

  function chooseFile(next: File) {
    setFile(next);
    if (mode === "jpg-png") setFormat(next.type === "image/png" ? "image/jpeg" : "image/png");
  }

  async function process() {
    if (!file) return;
    state.begin("Converting image locally");
    try {
      const result = await convertImage(file, format, quality / 100);
      setOutputs([{ blob: result.blob, filename: result.filename, url: result.url, meta: `${result.width}x${result.height}` }]);
      state.finish("Image converted.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} onFiles={([next]) => chooseFile(next)} label="Drop an image" description="or pick a JPG or PNG" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Output" value={format} onChange={(value) => setFormat(value as ImageFormat)}>
            {(mode === "jpg-png" ? ["image/png", "image/jpeg"] : ["image/webp", "image/png", "image/jpeg"]).map((item) => (
              <option key={item} value={item}>
                {imageFormatLabel(item as ImageFormat)}
              </option>
            ))}
          </SelectField>
          <RangeField label="Quality" value={quality} min={10} max={100} onChange={setQuality} suffix="%" />
        </div>
        <Button onClick={process} disabled={!file || state.busy}>
          {state.busy ? <Loader2 className="animate-spin" /> : <ImageIcon />}
          Convert
        </Button>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <OutputStack outputs={outputs} />
    </ToolPanel>
  );
}

function ImageCompressorTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(72);
  const [maxWidth, setMaxWidth] = useState(1800);
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process() {
    if (!file) return;
    state.begin("Compressing image");
    try {
      const bitmap = await loadBitmap(file);
      const scale = Math.min(1, maxWidth / bitmap.width);
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);
      bitmap.close();
      const result = await resizeImage(file, width, height, format, quality / 100);
      const saved = file.size ? Math.round((1 - result.blob.size / file.size) * 100) : 0;
      setOutputs([
        {
          blob: result.blob,
          filename: result.filename,
          url: result.url,
          meta: `${result.width}x${result.height}, ${saved > 0 ? `${saved}% smaller` : "optimized"}`
        }
      ]);
      state.finish("Compressed.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} onFiles={([next]) => setFile(next)} label="Drop an image to shrink" />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Format" value={format} onChange={(value) => setFormat(value as ImageFormat)}>
            <option value="image/webp">WEBP</option>
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
          </SelectField>
          <RangeField label="Quality" value={quality} min={20} max={100} onChange={setQuality} suffix="%" />
          <label className="grid gap-2">
            <Label>Max width</Label>
            <Input type="number" min={64} value={maxWidth} onChange={(event) => setMaxWidth(Number(event.target.value))} />
          </label>
        </div>
        <Button onClick={process} disabled={!file || state.busy}>
          {state.busy ? <Loader2 className="animate-spin" /> : <Wand2 />}
          Compress
        </Button>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <OutputStack outputs={outputs} />
    </ToolPanel>
  );
}

function ImageResizerTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function choose(next: File) {
    setFile(next);
    const bitmap = await loadBitmap(next);
    setOriginal({ width: bitmap.width, height: bitmap.height });
    setWidth(bitmap.width);
    setHeight(bitmap.height);
    bitmap.close();
  }

  function updateWidth(next: number) {
    setWidth(next);
    if (lockAspect && original.width) setHeight(Math.round((next / original.width) * original.height));
  }

  function updateHeight(next: number) {
    setHeight(next);
    if (lockAspect && original.height) setWidth(Math.round((next / original.height) * original.width));
  }

  async function process() {
    if (!file) return;
    state.begin("Resizing image");
    try {
      const result = await resizeImage(file, width, height, format, 0.92);
      setOutputs([{ blob: result.blob, filename: result.filename, url: result.url, meta: `${result.width}x${result.height}` }]);
      state.finish("Resized.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} onFiles={([next]) => void choose(next)} label="Drop an image to resize" />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2">
            <Label>Width</Label>
            <Input type="number" min={1} value={width} onChange={(event) => updateWidth(Number(event.target.value))} />
          </label>
          <label className="grid gap-2">
            <Label>Height</Label>
            <Input type="number" min={1} value={height} onChange={(event) => updateHeight(Number(event.target.value))} />
          </label>
          <SelectField label="Output" value={format} onChange={(value) => setFormat(value as ImageFormat)}>
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPG</option>
            <option value="image/webp">WEBP</option>
          </SelectField>
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-300">
          <input type="checkbox" checked={lockAspect} onChange={(event) => setLockAspect(event.target.checked)} />
          Lock aspect ratio {original.width ? `(${original.width}x${original.height})` : ""}
        </label>
        <Button onClick={process} disabled={!file || state.busy}>
          {state.busy ? <Loader2 className="animate-spin" /> : <ImageIcon />}
          Resize
        </Button>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <OutputStack outputs={outputs} />
    </ToolPanel>
  );
}

function ImageCropperTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [original, setOriginal] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 600, height: 400 });
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function choose(next: File) {
    setFile(next);
    setPreview(URL.createObjectURL(next));
    const bitmap = await loadBitmap(next);
    setOriginal({ width: bitmap.width, height: bitmap.height });
    setCrop({ x: 0, y: 0, width: Math.round(bitmap.width * 0.75), height: Math.round(bitmap.height * 0.75) });
    bitmap.close();
  }

  async function process() {
    if (!file) return;
    state.begin("Cropping image");
    try {
      const result = await cropImage(file, crop, format, 0.92);
      setOutputs([{ blob: result.blob, filename: result.filename, url: result.url, meta: `${result.width}x${result.height}` }]);
      state.finish("Cropped.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  const overlayStyle = original.width
    ? {
        left: `${(crop.x / original.width) * 100}%`,
        top: `${(crop.y / original.height) * 100}%`,
        width: `${(crop.width / original.width) * 100}%`,
        height: `${(crop.height / original.height) * 100}%`
      }
    : undefined;

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} onFiles={([next]) => void choose(next)} label="Drop an image to crop" />
        {preview ? (
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-80 w-full object-contain" />
            <div className="absolute border-2 border-cyan-200 bg-cyan-300/10 shadow-[0_0_28px_rgba(99,230,226,0.24)]" style={overlayStyle} />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {(["x", "y", "width", "height"] as const).map((key) => (
            <label key={key} className="grid gap-2">
              <Label>{key}</Label>
              <Input
                type="number"
                min={0}
                value={crop[key]}
                onChange={(event) => setCrop((current) => ({ ...current, [key]: Number(event.target.value) }))}
              />
            </label>
          ))}
        </div>
        <SelectField label="Output" value={format} onChange={(value) => setFormat(value as ImageFormat)}>
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPG</option>
          <option value="image/webp">WEBP</option>
        </SelectField>
        <Button onClick={process} disabled={!file || state.busy}>
          {state.busy ? <Loader2 className="animate-spin" /> : <ImageIcon />}
          Crop
        </Button>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <OutputStack outputs={outputs} />
    </ToolPanel>
  );
}

function ImageMetadataTool({ tool }: { tool: Tool }) {
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process(files: File[]) {
    state.begin("Removing metadata");
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const format: ImageFormat =
            file.type === "image/jpeg" ? "image/jpeg" : file.type === "image/webp" ? "image/webp" : "image/png";
          const result = await convertImage(file, format, 0.92);
          return {
            blob: result.blob,
            filename: replaceExtension(file.name.replace(/\.[^/.]+$/, "") + "-clean", imageExtensions[format]),
            url: result.url,
            meta: "metadata stripped"
          };
        })
      );
      setOutputs(results);
      state.finish("Metadata removed.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} multiple onFiles={(files) => void process(files)} label="Drop image files" />
        <p className="text-sm leading-6 text-stone-400">
          This keeps what you can see and leaves behind hidden camera/location details when the browser can remove them.
        </p>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <OutputStack outputs={outputs} />
    </ToolPanel>
  );
}

function PaletteTool({ tool }: { tool: Tool }) {
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function process(file: File) {
    setBusy(true);
    setError("");
    try {
      setPalette(await extractPalette(file, 10));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not extract the palette.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} onFiles={([file]) => void process(file)} label="Drop an image for colors" />
        <ToolStatus busy={busy} message="Sampling image colors" error={error} />
      </ControlGroup>
      <div className="space-y-3">
        {palette.length ? (
          palette.map((color) => (
            <button
              key={color.hex}
              type="button"
              onClick={() => void navigator.clipboard.writeText(color.hex)}
              className="flex w-full items-center gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-cyan-300/30"
            >
              <span className="size-12 rounded-md border border-white/12" style={{ backgroundColor: color.hex }} />
              <span>
                <span className="mono block text-sm text-stone-100">{color.hex}</span>
                <span className="text-xs text-stone-500">{color.rgb}</span>
              </span>
              <Copy className="ml-auto size-4 text-stone-500" />
            </button>
          ))
        ) : (
          <OutputStack outputs={[]} />
        )}
      </div>
    </ToolPanel>
  );
}

function BpmTool({ tool }: { tool: Tool }) {
  const [result, setResult] = useState<{ bpm: number; confidence: number; candidates: number[] } | null>(null);
  const state = useBusyState();

  async function process(file: File) {
    state.begin("Listening for the beat");
    try {
      setResult(await estimateBpm(file));
      state.finish("Best guess ready.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} onFiles={([file]) => void process(file)} label="Drop an audio file" />
        <p className="text-sm leading-6 text-stone-400">
          This works best when the song has a steady pulse. If the track drifts or barely has drums, treat the number as
          a starting point.
        </p>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
        {result ? (
          <div>
            <p className="mono text-xs uppercase tracking-[0.22em] text-stone-500">Estimated BPM</p>
            <p className="crt-glow my-4 text-7xl font-semibold text-cyan-100">{result.bpm || "?"}</p>
            <p className="text-sm text-stone-400">{bpmFeel(result.confidence)}</p>
            <p className="mt-3 text-xs text-stone-500">
              Other close guesses: {result.candidates.slice(1).join(", ") || "none"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-stone-500">The beat estimate will show up here.</p>
        )}
      </div>
    </ToolPanel>
  );
}

function bpmFeel(score: number) {
  if (score >= 55) return "This one looks pretty steady.";
  if (score >= 30) return "This is a decent guess. Give it a quick listen-check.";
  return "This track is hard to read. Try this as a rough starting point.";
}

function AudioConverterTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("mp3");
  const [output, setOutput] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process() {
    if (!file) return;
    state.begin("Preparing audio conversion");
    try {
      const name = outputName(file, format);
      const args = ["-i", "$INPUT", "-vn", "$OUTPUT"];
      const result = await runFfmpeg(file, args, name, mediaFormats.audio[format as keyof typeof mediaFormats.audio], onMediaProgress(state.setMessage));
      setOutput([{ blob: result.blob, filename: result.filename, url: result.url }]);
      state.finish("Audio converted.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <MediaToolPanel
      tool={tool}
      file={file}
      setFile={setFile}
      state={state}
      output={output}
      action="Convert audio"
      onAction={process}
    >
      <SelectField label="Output format" value={format} onChange={setFormat}>
        {Object.keys(mediaFormats.audio).map((item) => (
          <option key={item} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </SelectField>
    </MediaToolPanel>
  );
}

function AudioTrimmerTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [format, setFormat] = useState("wav");
  const [output, setOutput] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process() {
    if (!file) return;
    if (end <= start) {
      state.fail(new Error("End time must be greater than start time."));
      return;
    }
    state.begin("Trimming audio");
    try {
      const extension = format;
      const name = replaceExtension(file.name.replace(/\.[^/.]+$/, "") + "-trimmed", extension);
      const result = await runFfmpeg(
        file,
        ["-ss", String(start), "-i", "$INPUT", "-t", String(end - start), "-map_metadata", "-1", "$OUTPUT"],
        name,
        mediaFormats.audio[format as keyof typeof mediaFormats.audio],
        onMediaProgress(state.setMessage)
      );
      setOutput([{ blob: result.blob, filename: result.filename, url: result.url }]);
      state.finish("Audio trimmed.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <MediaToolPanel tool={tool} file={file} setFile={setFile} state={state} output={output} action="Trim audio" onAction={process}>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <Label>Start seconds</Label>
          <Input type="number" min={0} step={0.1} value={start} onChange={(event) => setStart(Number(event.target.value))} />
        </label>
        <label className="grid gap-2">
          <Label>End seconds</Label>
          <Input type="number" min={0} step={0.1} value={end} onChange={(event) => setEnd(Number(event.target.value))} />
        </label>
        <SelectField label="Format" value={format} onChange={setFormat}>
          <option value="wav">WAV</option>
          <option value="mp3">MP3</option>
        </SelectField>
      </div>
    </MediaToolPanel>
  );
}

function WaveformTool({ tool }: { tool: Tool }) {
  const [width, setWidth] = useState(1600);
  const [height, setHeight] = useState(520);
  const [accent, setAccent] = useState("#63e6e2");
  const [background, setBackground] = useState("#08090d");
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process(file: File) {
    state.begin("Rendering waveform");
    try {
      const result = await drawWaveform(file, { width, height, accent, background });
      setOutputs([
        {
          blob: result.blob,
          filename: replaceExtension(file.name.replace(/\.[^/.]+$/, "") + "-waveform", "png"),
          url: result.url,
          meta: `${Math.round(result.duration)}s`
        }
      ]);
      state.finish("Waveform rendered.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} onFiles={([file]) => void process(file)} label="Drop audio for waveform" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <Label>Width</Label>
            <Input type="number" min={320} value={width} onChange={(event) => setWidth(Number(event.target.value))} />
          </label>
          <label className="grid gap-2">
            <Label>Height</Label>
            <Input type="number" min={120} value={height} onChange={(event) => setHeight(Number(event.target.value))} />
          </label>
          <label className="grid gap-2">
            <Label>Wave color</Label>
            <Input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <Label>Background</Label>
            <Input type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
          </label>
        </div>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <OutputStack outputs={outputs} />
    </ToolPanel>
  );
}

function AudioMetadataTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process() {
    if (!file) return;
    state.begin("Cleaning audio metadata");
    try {
      const extension = file.name.split(".").pop() || "audio";
      const name = replaceExtension(file.name.replace(/\.[^/.]+$/, "") + "-clean", extension);
      const result = await runFfmpeg(
        file,
        ["-i", "$INPUT", "-map_metadata", "-1", "-c", "copy", "$OUTPUT"],
        name,
        file.type || "application/octet-stream",
        onMediaProgress(state.setMessage)
      );
      setOutput([{ blob: result.blob, filename: result.filename, url: result.url, meta: "metadata stripped" }]);
      state.finish("Audio metadata removed.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <MediaToolPanel
      tool={tool}
      file={file}
      setFile={setFile}
      state={state}
      output={output}
      action="Clean metadata"
      onAction={process}
    />
  );
}

function Mp4ConverterTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process() {
    if (!file) return;
    state.begin("Converting to MP4");
    try {
      const name = outputName(file, "mp4");
      const result = await runFfmpeg(
        file,
        ["-i", "$INPUT", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart", "$OUTPUT"],
        name,
        mediaFormats.video.mp4,
        onMediaProgress(state.setMessage)
      );
      setOutput([{ blob: result.blob, filename: result.filename, url: result.url }]);
      state.finish("Video converted.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <MediaToolPanel tool={tool} file={file} setFile={setFile} state={state} output={output} action="Convert to MP4" onAction={process} />
  );
}

function VideoCompressorTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [crf, setCrf] = useState(28);
  const [width, setWidth] = useState(1280);
  const [output, setOutput] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process() {
    if (!file) return;
    state.begin("Compressing video");
    try {
      const name = replaceExtension(file.name.replace(/\.[^/.]+$/, "") + "-compressed", "mp4");
      const result = await runFfmpeg(
        file,
        [
          "-i",
          "$INPUT",
          "-vf",
          `scale='min(${width},iw)':-2`,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          String(crf),
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          "$OUTPUT"
        ],
        name,
        mediaFormats.video.mp4,
        onMediaProgress(state.setMessage)
      );
      const saved = file.size ? Math.round((1 - result.blob.size / file.size) * 100) : 0;
      setOutput([{ blob: result.blob, filename: result.filename, url: result.url, meta: saved > 0 ? `${saved}% smaller` : "compressed" }]);
      state.finish("Video compressed.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <MediaToolPanel tool={tool} file={file} setFile={setFile} state={state} output={output} action="Compress video" onAction={process}>
      <div className="grid gap-4 sm:grid-cols-2">
        <RangeField label="CRF" value={crf} min={18} max={36} onChange={setCrf} />
        <label className="grid gap-2">
          <Label>Max width</Label>
          <Input type="number" min={240} value={width} onChange={(event) => setWidth(Number(event.target.value))} />
        </label>
      </div>
    </MediaToolPanel>
  );
}

function GifMakerTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(4);
  const [width, setWidth] = useState(540);
  const [fps, setFps] = useState(12);
  const [output, setOutput] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process() {
    if (!file) return;
    state.begin("Making GIF");
    try {
      const name = replaceExtension(file.name.replace(/\.[^/.]+$/, "") + "-clip", "gif");
      const result = await runFfmpeg(
        file,
        ["-ss", String(start), "-t", String(duration), "-i", "$INPUT", "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos`, "$OUTPUT"],
        name,
        mediaFormats.video.gif,
        onMediaProgress(state.setMessage)
      );
      setOutput([{ blob: result.blob, filename: result.filename, url: result.url, meta: `${duration}s, ${fps}fps` }]);
      state.finish("GIF ready.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <MediaToolPanel tool={tool} file={file} setFile={setFile} state={state} output={output} action="Make GIF" onAction={process}>
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="grid gap-2">
          <Label>Start</Label>
          <Input type="number" min={0} step={0.1} value={start} onChange={(event) => setStart(Number(event.target.value))} />
        </label>
        <label className="grid gap-2">
          <Label>Seconds</Label>
          <Input type="number" min={0.5} step={0.5} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
        </label>
        <label className="grid gap-2">
          <Label>Width</Label>
          <Input type="number" min={120} value={width} onChange={(event) => setWidth(Number(event.target.value))} />
        </label>
        <label className="grid gap-2">
          <Label>FPS</Label>
          <Input type="number" min={6} max={30} value={fps} onChange={(event) => setFps(Number(event.target.value))} />
        </label>
      </div>
    </MediaToolPanel>
  );
}

function ExtractAudioTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("mp3");
  const [output, setOutput] = useState<OutputFile[]>([]);
  const state = useBusyState();

  async function process() {
    if (!file) return;
    state.begin("Extracting audio");
    try {
      const name = replaceExtension(file.name.replace(/\.[^/.]+$/, "") + "-audio", format);
      const result = await runFfmpeg(
        file,
        ["-i", "$INPUT", "-vn", "-map_metadata", "-1", "$OUTPUT"],
        name,
        mediaFormats.audio[format as keyof typeof mediaFormats.audio],
        onMediaProgress(state.setMessage)
      );
      setOutput([{ blob: result.blob, filename: result.filename, url: result.url }]);
      state.finish("Audio extracted.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <MediaToolPanel tool={tool} file={file} setFile={setFile} state={state} output={output} action="Extract audio" onAction={process}>
      <SelectField label="Output format" value={format} onChange={setFormat}>
        <option value="mp3">MP3</option>
        <option value="wav">WAV</option>
      </SelectField>
    </MediaToolPanel>
  );
}

function MediaToolPanel({
  tool,
  file,
  setFile,
  state,
  output,
  action,
  onAction,
  children
}: {
  tool: Tool;
  file: File | null;
  setFile: (file: File) => void;
  state: ReturnType<typeof useBusyState>;
  output: OutputFile[];
  action: string;
  onAction: () => void | Promise<void>;
  children?: React.ReactNode;
}) {
  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept={tool.accepts} onFiles={([next]) => setFile(next)} label="Drop your file here" />
        {file ? (
          <div className="rounded-md border border-white/10 bg-black/20 p-3 text-xs text-stone-400">
            {file.name} - {formatBytes(file.size)}
          </div>
        ) : null}
        {children}
        <Button onClick={() => void onAction()} disabled={!file || state.busy}>
          {state.busy ? <Loader2 className="animate-spin" /> : <Music2 />}
          {action}
        </Button>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <OutputStack outputs={output} />
    </ToolPanel>
  );
}

function TextDrop({ onText }: { onText: (text: string) => void }) {
  return (
    <Dropzone
      accept=".txt,.srt,.vtt,text/plain"
      onFiles={([file]) => {
        void readTextFile(file).then(onText);
      }}
      label="Drop a text file"
      description="or paste directly below"
    />
  );
}

function YoutubeFormatterTool({ tool }: { tool: Tool }) {
  void tool;
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [links, setLinks] = useState("");
  const [credits, setCredits] = useState("");
  const [chapters, setChapters] = useState("");
  const [hashtags, setHashtags] = useState("");
  const formatted = formatYoutubeDescription({ title, summary, links, credits, chapters, hashtags });

  return (
    <ToolPanel>
      <ControlGroup>
        <TextDrop onText={setSummary} />
        <label className="grid gap-2">
          <Label>Title</Label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A clean title, no shouting required" />
        </label>
        <label className="grid gap-2">
          <Label>Summary</Label>
          <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <Label>Links</Label>
            <Textarea value={links} onChange={(event) => setLinks(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <Label>Credits</Label>
            <Textarea value={credits} onChange={(event) => setCredits(event.target.value)} />
          </label>
        </div>
        <label className="grid gap-2">
          <Label>Chapters</Label>
          <Textarea value={chapters} onChange={(event) => setChapters(event.target.value)} placeholder="00:00 Intro" />
        </label>
        <label className="grid gap-2">
          <Label>Hashtags</Label>
          <Input value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="#music #studio #live" />
        </label>
      </ControlGroup>
      <CopyPanel
        title={formatted.title || "Formatted title"}
        body={formatted.description || "Formatted description will appear here."}
        filename="youtube-description.txt"
      />
    </ToolPanel>
  );
}

function HashtagCleanerTool({ tool }: { tool: Tool }) {
  void tool;
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(30);
  const [separator, setSeparator] = useState("space");
  const tags = cleanHashtags(text, limit);
  const output = separator === "line" ? tags.join("\n") : tags.join(" ");

  return (
    <ToolPanel>
      <ControlGroup>
        <TextDrop onText={setText} />
        <label className="grid gap-2">
          <Label>Hashtags</Label>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="#music, MUSIC, #new-release" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <Label>Limit</Label>
            <Input type="number" min={1} max={60} value={limit} onChange={(event) => setLimit(Number(event.target.value))} />
          </label>
          <SelectField label="Separator" value={separator} onChange={setSeparator}>
            <option value="space">Spaces</option>
            <option value="line">New lines</option>
          </SelectField>
        </div>
      </ControlGroup>
      <CopyPanel title={`${tags.length} cleaned hashtags`} body={output || "Cleaned hashtags will appear here."} filename="hashtags.txt" />
    </ToolPanel>
  );
}

function CharacterCounterTool({ tool }: { tool: Tool }) {
  void tool;
  const [text, setText] = useState("");
  const counts = countText(text);
  const stats = [
    ["Characters", counts.characters],
    ["No spaces", counts.charactersNoSpaces],
    ["Words", counts.words],
    ["Lines", counts.lines],
    ["Sentences", counts.sentences],
    ["Bytes", counts.bytes],
    ["Reading", `${Math.max(1, Math.ceil(counts.readingMinutes))} min`],
    ["Tweet room", Math.max(0, 280 - counts.characters)]
  ];

  return (
    <ToolPanel>
      <ControlGroup>
        <TextDrop onText={setText} />
        <label className="grid gap-2">
          <Label>Text</Label>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-72" />
        </label>
      </ControlGroup>
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
            <p className="mono mt-2 text-2xl text-cyan-100">{value}</p>
          </div>
        ))}
      </div>
    </ToolPanel>
  );
}

function SubtitleFormatterTool({ tool }: { tool: Tool }) {
  void tool;
  const [text, setText] = useState("");
  const [shift, setShift] = useState(0);
  const [format, setFormat] = useState<"srt" | "vtt">("srt");
  const output = useMemo(() => shiftSubtitleTimestamps(text, shift, format), [text, shift, format]);

  return (
    <ToolPanel>
      <ControlGroup>
        <TextDrop onText={setText} />
        <label className="grid gap-2">
          <Label>Subtitle text</Label>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-72 mono" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <Label>Shift seconds</Label>
            <Input type="number" step={0.1} value={shift} onChange={(event) => setShift(Number(event.target.value))} />
          </label>
          <SelectField label="Output" value={format} onChange={(value) => setFormat(value as "srt" | "vtt")}>
            <option value="srt">SRT</option>
            <option value="vtt">VTT</option>
          </SelectField>
        </div>
      </ControlGroup>
      <CopyPanel title="Formatted subtitles" body={output || "Formatted subtitles will appear here."} filename={`subtitles.${format}`} />
    </ToolPanel>
  );
}

function CopyPanel({ title, body, filename }: { title: string; body: string; filename: string }) {
  const blob = useMemo(() => new Blob([body], { type: "text/plain;charset=utf-8" }), [body]);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-stone-50">{title}</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => void navigator.clipboard.writeText(body)}>
            <Copy />
            Copy
          </Button>
          <Button variant="secondary" size="sm" onClick={() => downloadBlob(blob, filename)}>
            <Download />
            TXT
          </Button>
        </div>
      </div>
      <pre className="mono max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/30 p-4 text-sm leading-6 text-stone-200">
        {body}
      </pre>
    </div>
  );
}

function CrtTextTool({ tool }: { tool: Tool }) {
  void tool;
  const [text, setText] = useState("INFINITE TOOLS");
  const [accent, setAccent] = useState("#63e6e2");
  const [background, setBackground] = useState("#08090d");
  const [outputs, setOutputs] = useState<OutputFile[]>([]);

  async function render() {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 900;
    const context = getCanvasContext(canvas);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "96px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = accent;
    context.shadowBlur = 28;
    context.fillStyle = accent;
    wrapCanvasText(context, text, canvas.width / 2, canvas.height / 2 - 40, 1320, 112);
    context.shadowBlur = 0;
    context.fillStyle = "rgba(255,255,255,0.08)";
    for (let y = 0; y < canvas.height; y += 6) context.fillRect(0, y, canvas.width, 1);
    setOutputs([await canvasOutput(canvas, "crt-text.png")]);
  }

  return (
    <CanvasTool
      label="CRT text"
      text={text}
      setText={setText}
      outputs={outputs}
      onRender={render}
      controls={
        <>
          <label className="grid gap-2">
            <Label>Glow</Label>
            <Input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <Label>Background</Label>
            <Input type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
          </label>
        </>
      }
    />
  );
}

function VhsSubtitleTool({ tool }: { tool: Tool }) {
  void tool;
  const [text, setText] = useState("somewhere after midnight");
  const [outputs, setOutputs] = useState<OutputFile[]>([]);

  async function render() {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const context = getCanvasContext(canvas);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "64px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 9;
    context.strokeStyle = "rgba(0,0,0,0.85)";
    context.shadowColor = "rgba(99,230,226,0.45)";
    context.shadowBlur = 4;
    wrapCanvasText(context, text.toUpperCase(), canvas.width / 2, 860, 1500, 76, true);
    setOutputs([await canvasOutput(canvas, "vhs-subtitle.png")]);
  }

  return <CanvasTool label="VHS subtitle text" text={text} setText={setText} outputs={outputs} onRender={render} controls={null} />;
}

function RetroButtonTool({ tool }: { tool: Tool }) {
  void tool;
  const [text, setText] = useState("infinite guest");
  const [left, setLeft] = useState("#63e6e2");
  const [right, setRight] = useState("#ff6b9a");
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const [snippet, setSnippet] = useState("");

  async function render() {
    const canvas = document.createElement("canvas");
    canvas.width = 264;
    canvas.height = 93;
    const context = getCanvasContext(canvas);
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, left);
    gradient.addColorStop(1, right);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 6;
    context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    context.fillStyle = "#050608";
    context.globalAlpha = 0.82;
    context.fillRect(14, 18, canvas.width - 28, canvas.height - 36);
    context.globalAlpha = 1;
    context.font = "bold 24px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#f5f1e8";
    context.fillText(text.slice(0, 18).toUpperCase(), canvas.width / 2, canvas.height / 2 + 1);
    const output = await canvasOutput(canvas, "retro-button.png");
    setOutputs([output]);
    setSnippet('<a href="https://infinite.tools"><img src="retro-button.png" width="88" height="31" alt="Infinite Guest"></a>');
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <TextDrop onText={setText} />
        <label className="grid gap-2">
          <Label>Button text</Label>
          <Input value={text} maxLength={18} onChange={(event) => setText(event.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <Label>Left color</Label>
            <Input type="color" value={left} onChange={(event) => setLeft(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <Label>Right color</Label>
            <Input type="color" value={right} onChange={(event) => setRight(event.target.value)} />
          </label>
        </div>
        <Button onClick={() => void render()}>
          <Sparkles />
          Render button
        </Button>
      </ControlGroup>
      <div className="space-y-4">
        <OutputStack outputs={outputs} />
        {snippet ? <CopyPanel title="HTML snippet" body={snippet} filename="button-snippet.html" /> : null}
      </div>
    </ToolPanel>
  );
}

function CanvasTool({
  label,
  text,
  setText,
  outputs,
  onRender,
  controls
}: {
  label: string;
  text: string;
  setText: (text: string) => void;
  outputs: OutputFile[];
  onRender: () => void | Promise<void>;
  controls: React.ReactNode;
}) {
  return (
    <ToolPanel>
      <ControlGroup>
        <TextDrop onText={setText} />
        <label className="grid gap-2">
          <Label>{label}</Label>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        {controls ? <div className="grid gap-4 sm:grid-cols-2">{controls}</div> : null}
        <Button onClick={() => void onRender()}>
          <Sparkles />
          Render PNG
        </Button>
      </ControlGroup>
      <OutputStack outputs={outputs} />
    </ToolPanel>
  );
}

function QrTool({ tool }: { tool: Tool }) {
  void tool;
  const [text, setText] = useState("https://infinite.tools");
  const [margin, setMargin] = useState(2);
  const [dark, setDark] = useState("#08090d");
  const [light, setLight] = useState("#f5f1e8");
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const [svg, setSvg] = useState("");
  const state = useBusyState();

  async function render() {
    state.begin("Rendering QR code");
    try {
      const dataUrl = await QRCode.toDataURL(text || " ", {
        margin,
        width: 1024,
        color: { dark, light },
        errorCorrectionLevel: "M"
      });
      const png = await (await fetch(dataUrl)).blob();
      const svgText = await QRCode.toString(text || " ", {
        type: "svg",
        margin,
        color: { dark, light },
        errorCorrectionLevel: "M"
      });
      setSvg(svgText);
      setOutputs([{ blob: png, filename: "qr-code.png", url: URL.createObjectURL(png) }]);
      state.finish("QR code ready.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <TextDrop onText={setText} />
        <label className="grid gap-2">
          <Label>QR content</Label>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <RangeField label="Margin" value={margin} min={0} max={8} onChange={setMargin} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <Label>Dark</Label>
            <Input type="color" value={dark} onChange={(event) => setDark(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <Label>Light</Label>
            <Input type="color" value={light} onChange={(event) => setLight(event.target.value)} />
          </label>
        </div>
        <Button onClick={() => void render()} disabled={state.busy}>
          {state.busy ? <Loader2 className="animate-spin" /> : <Hash />}
          Generate QR
        </Button>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <div className="space-y-4">
        <OutputStack outputs={outputs} />
        {svg ? <CopyPanel title="SVG code" body={svg} filename="qr-code.svg" /> : null}
      </div>
    </ToolPanel>
  );
}

function UuidTool({ tool }: { tool: Tool }) {
  void tool;
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>([]);
  const [note, setNote] = useState("Random UUID v4");

  function generate() {
    setNote("Random UUID v4");
    setIds(Array.from({ length: count }, () => crypto.randomUUID()));
  }

  async function fromFile(file: File) {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    setNote(`Deterministic ID from ${file.name}`);
    setIds([uuidFromBytes(new Uint8Array(digest))]);
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept="*/*" onFiles={([file]) => void fromFile(file)} label="Drop any file to make a repeatable ID" />
        <label className="grid gap-2">
          <Label>How many random IDs</Label>
          <Input type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} />
        </label>
        <Button onClick={generate}>
          <RotateCcw />
          Generate UUIDs
        </Button>
      </ControlGroup>
      <CopyPanel title={note} body={ids.join("\n") || "Generated UUIDs will appear here."} filename="uuids.txt" />
    </ToolPanel>
  );
}

function HashTool({ tool }: { tool: Tool }) {
  void tool;
  const [text, setText] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [result, setResult] = useState("");
  const [label, setLabel] = useState("Text hash");
  const state = useBusyState();

  async function processBuffer(buffer: ArrayBuffer, name: string) {
    state.begin("Hashing locally");
    try {
      const [hash, crc] = await Promise.all([hashBuffer(buffer, algorithm), Promise.resolve(crc32(buffer))]);
      setLabel(name);
      setResult(`${algorithm}: ${hash}\nCRC32: ${crc}`);
      state.finish("Hash ready.");
    } catch (error) {
      state.fail(error);
      state.setBusy(false);
    }
  }

  return (
    <ToolPanel>
      <ControlGroup>
        <Dropzone accept="*/*" onFiles={([file]) => void file.arrayBuffer().then((buffer) => processBuffer(buffer, file.name))} label="Drop a file to check it" />
        <label className="grid gap-2">
          <Label>Text</Label>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <SelectField label="Algorithm" value={algorithm} onChange={(value) => setAlgorithm(value as HashAlgorithm)}>
          <option value="SHA-1">SHA-1</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-384">SHA-384</option>
          <option value="SHA-512">SHA-512</option>
        </SelectField>
        <Button onClick={() => void processBuffer(new TextEncoder().encode(text).buffer, "Text hash")} disabled={state.busy}>
          {state.busy ? <Loader2 className="animate-spin" /> : <FileText />}
          Hash text
        </Button>
        <ToolStatus busy={state.busy} message={state.message} error={state.error} />
      </ControlGroup>
      <CopyPanel title={label} body={result || "Hash output will appear here."} filename="hash.txt" />
    </ToolPanel>
  );
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available in this browser.");
  return context;
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  strokeFirst = false
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((item, index) => {
    if (strokeFirst) context.strokeText(item, x, startY + index * lineHeight);
    context.fillText(item, x, startY + index * lineHeight);
  });
}

async function canvasOutput(canvas: HTMLCanvasElement, filename: string): Promise<OutputFile> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Could not render PNG."))), "image/png");
  });
  return {
    blob,
    filename,
    url: URL.createObjectURL(blob),
    meta: `${canvas.width}x${canvas.height}`
  };
}
