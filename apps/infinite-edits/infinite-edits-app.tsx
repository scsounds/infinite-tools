"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import {
  AudioLines,
  FileAudio,
  Film,
  FolderOpen,
  Loader2,
  Magnet,
  Pause,
  Play,
  RefreshCcw,
  Sparkles,
  Upload,
  Wand2,
  Waves
} from "lucide-react";

import { VisualPreview } from "@/apps/infinite-edits/visual-preview";
import { Button } from "@/components/ui/button";
import { analyzeAudioBufferForEdits } from "@/lib/infinite-edits/audio-analysis";
import { generateTimelineClips, snapTimeToBeat, timelineDuration } from "@/lib/infinite-edits/engine";
import { editPresets, getEditPreset } from "@/lib/infinite-edits/presets";
import { decodeAudioFile } from "@/lib/processors/audio";
import { cn, formatBytes } from "@/lib/utils";
import type { EditableAsset, EditPresetId, MediaKind, MusicAnalysis, TimelineClip } from "@/types/infinite-edits";

type DragState = {
  clipId: string;
  mode: "move" | "trim-start" | "trim-end";
  startX: number;
  originalStart: number;
  originalDuration: number;
  originalInPoint: number;
  originalOutPoint: number;
};

const pxPerSecondMin = 18;
const pxPerSecondMax = 120;

export function InfiniteEditsApp() {
  const [assets, setAssets] = useState<EditableAsset[]>([]);
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null);
  const [presetId, setPresetId] = useState<EditPresetId>("dubstep");
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [zoom, setZoom] = useState(48);
  const [status, setStatus] = useState("Import a song and a few visuals to build a first cut.");
  const [busy, setBusy] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const preset = getEditPreset(presetId);
  const audioAsset = assets.find((asset) => asset.kind === "audio");
  const visualAssets = assets.filter((asset) => asset.kind !== "audio");
  const duration = Math.max(analysis?.duration || 0, timelineDuration(clips, 30));
  const activeClip = clips.find((clip) => currentTime >= clip.start && currentTime < clip.start + clip.duration);
  const activeAsset = activeClip ? assets.find((asset) => asset.id === activeClip.assetId) : visualAssets[0];

  useEffect(() => {
    folderInputRef.current?.setAttribute("webkitdirectory", "");
    folderInputRef.current?.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioAsset) return;
    audio.src = audioAsset.url;
    audio.load();
  }, [audioAsset]);

  useEffect(() => {
    let frame = 0;
    function tick() {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
      } else if (playing && !audioAsset) {
        setCurrentTime((time) => (duration ? (time + 1 / 60) % duration : time + 1 / 60));
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [audioAsset, duration, playing]);

  const importFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((file) => classifyFile(file));
      if (!files.length) {
        setStatus("I could not find image, video, or audio files in that drop.");
        return;
      }

      setBusy(true);
      setStatus(`Importing ${files.length} file${files.length === 1 ? "" : "s"}...`);
      try {
        const imported: EditableAsset[] = [];
        let firstAudio: { file: File; asset: EditableAsset } | null = null;

        for (const file of files) {
          const asset = await createAsset(file);
          imported.push(asset);
          if (!firstAudio && asset.kind === "audio") firstAudio = { file, asset };
        }

        if (firstAudio) {
          const nextAnalysis = await analyzeAudio(firstAudio.file, firstAudio.asset);
          setAnalysis(nextAnalysis);
          setStatus(
            `Mapped ${nextAnalysis.bpm || "?"} BPM, ${nextAnalysis.beats.length} beats, and ${nextAnalysis.sections.length} music sections.`
          );
        } else {
          setStatus(`Imported ${imported.length} visual file${imported.length === 1 ? "" : "s"}. Add audio when ready.`);
        }

        setAssets((current) => [...current, ...imported]);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Import failed.");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  function runAutoSequence() {
    const nextClips = generateTimelineClips(assets, analysis, preset);
    setClips(nextClips);
    setSelectedClipId(nextClips[0]?.id || null);
    setCurrentTime(0);
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlaying(false);
    setStatus(
      nextClips.length
        ? `Built ${nextClips.length} beat-snapped clips with the ${preset.name} grammar.`
        : "Add at least one image or video to build an edit."
    );
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (audioAsset && audio) {
      if (audio.paused) {
        void audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
      return;
    }
    setPlaying((value) => !value);
  }

  function seek(time: number) {
    const next = Math.max(0, Math.min(duration, time));
    setCurrentTime(next);
    if (audioRef.current) audioRef.current.currentTime = next;
  }

  function beginClipDrag(event: ReactPointerEvent, clip: TimelineClip, mode: DragState["mode"]) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedClipId(clip.id);
    setDragState({
      clipId: clip.id,
      mode,
      startX: event.clientX,
      originalStart: clip.start,
      originalDuration: clip.duration,
      originalInPoint: clip.inPoint,
      originalOutPoint: clip.outPoint
    });
  }

  function handleTimelinePointerMove(event: ReactPointerEvent) {
    if (!dragState) return;
    const delta = (event.clientX - dragState.startX) / zoom;
    const beats = analysis?.beats || [];

    setClips((current) =>
      current.map((clip) => {
        if (clip.id !== dragState.clipId) return clip;

        if (dragState.mode === "move") {
          const rawStart = Math.max(0, dragState.originalStart + delta);
          const start = snapEnabled ? snapTimeToBeat(rawStart, beats) : rawStart;
          return { ...clip, start };
        }

        if (dragState.mode === "trim-start") {
          const rawStart = Math.max(0, Math.min(dragState.originalStart + delta, dragState.originalStart + dragState.originalDuration - 0.2));
          const start = snapEnabled ? snapTimeToBeat(rawStart, beats) : rawStart;
          const amount = start - dragState.originalStart;
          return {
            ...clip,
            start,
            duration: Math.max(0.2, dragState.originalDuration - amount),
            inPoint: Math.max(0, dragState.originalInPoint + amount)
          };
        }

        const rawEnd = Math.max(clip.start + 0.2, dragState.originalStart + dragState.originalDuration + delta);
        const end = snapEnabled ? snapTimeToBeat(rawEnd, beats) : rawEnd;
        return {
          ...clip,
          duration: Math.max(0.2, end - clip.start),
          outPoint: Math.max(clip.inPoint + 0.2, dragState.originalInPoint + Math.max(0.2, end - clip.start))
        };
      })
    );
  }

  function clearSession() {
    assets.forEach((asset) => URL.revokeObjectURL(asset.url));
    setAssets([]);
    setAnalysis(null);
    setClips([]);
    setSelectedClipId(null);
    setCurrentTime(0);
    setPlaying(false);
    setStatus("Cleared. Ready for a new song and new visuals.");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <audio ref={audioRef} onEnded={() => setPlaying(false)} className="hidden" />

      <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.82fr] lg:items-end">
        <div>
          <p className="mono mb-3 text-xs uppercase tracking-[0.28em] text-cyan-100/80">Infinite Edits</p>
          <h1 className="crt-glow max-w-4xl text-4xl font-semibold text-stone-50 sm:text-6xl">
            Music-reactive edits, built from your files.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-400">
            Import a song plus clips or images, pick an editing grammar, and generate a beat-synced first cut you can
            drag around, trim, and preview through real WebGL FX.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <p className="mono mb-2 text-xs uppercase tracking-[0.22em] text-stone-500">Session</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Media" value={assets.length.toString()} />
            <MiniStat label="Clips" value={clips.length.toString()} />
            <MiniStat label="BPM" value={analysis?.bpm ? String(analysis.bpm) : "--"} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <ImportPanel
            busy={busy}
            status={status}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
            onImport={importFiles}
          />

          <PresetPanel presetId={presetId} onPreset={setPresetId} />

          <AnalysisPanel analysis={analysis} />
        </div>

        <div className="space-y-5">
          <VisualPreview
            asset={activeAsset}
            preset={preset}
            analysis={analysis}
            activeClip={activeClip}
            playing={playing}
            currentTime={currentTime}
          />

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <Button onClick={togglePlayback} disabled={!clips.length && !audioAsset}>
              {playing ? <Pause /> : <Play />}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button variant="secondary" onClick={runAutoSequence} disabled={!visualAssets.length || busy}>
              <Wand2 />
              Build beat edit
            </Button>
            <Button variant="secondary" onClick={clearSession} disabled={!assets.length && !clips.length}>
              <RefreshCcw />
              Clear
            </Button>
            <button
              type="button"
              onClick={() => setSnapEnabled((value) => !value)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition",
                snapEnabled
                  ? "border-cyan-300/40 bg-cyan-300/12 text-cyan-50"
                  : "border-white/12 bg-white/[0.04] text-stone-400"
              )}
            >
              <Magnet className="size-4" />
              Snap
            </button>
            <label className="ml-auto grid min-w-48 gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-stone-500">Timeline zoom</span>
              <input
                type="range"
                min={pxPerSecondMin}
                max={pxPerSecondMax}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="accent-cyan-300"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <MediaBin assets={assets} audioAssetId={audioAsset?.id} onAnalyzeAgain={(asset) => void reanalyzeAsset(asset)} />
        <TimelineEditor
          clips={clips}
          assets={assets}
          analysis={analysis}
          currentTime={currentTime}
          duration={duration}
          zoom={zoom}
          selectedClipId={selectedClipId}
          timelineRef={timelineRef}
          onSeek={seek}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={() => setDragState(null)}
          onClipPointerDown={beginClipDrag}
        />
      </section>
    </div>
  );

  async function reanalyzeAsset(asset: EditableAsset) {
    if (asset.kind !== "audio") return;
    setStatus("Re-analysis needs the original file. Re-import the song to analyze it again.");
  }
}

function ImportPanel({
  busy,
  status,
  fileInputRef,
  folderInputRef,
  onImport
}: {
  busy: boolean;
  status: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  onImport: (files: FileList | File[]) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-stone-50">Import media</h2>
          <p className="mt-1 text-sm text-stone-500">Audio, video, images, or a whole folder of source material.</p>
        </div>
        {busy ? <Loader2 className="size-5 animate-spin text-cyan-100" /> : <Upload className="size-5 text-cyan-100" />}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void onImport(event.dataTransfer.files);
        }}
        className={cn(
          "grid min-h-44 place-items-center rounded-lg border border-dashed border-white/18 bg-black/22 p-6 text-center transition",
          dragging && "border-cyan-300/60 bg-cyan-300/[0.07]"
        )}
      >
        <div>
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-md border border-cyan-300/25 bg-cyan-300/10">
            <Sparkles className="size-5 text-cyan-100" />
          </div>
          <p className="text-sm font-medium text-stone-100">Drop song, clips, images, or folders here</p>
          <p className="mt-1 text-xs text-stone-500">Everything stays in this browser session.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload />
              Pick files
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => folderInputRef.current?.click()}>
              <FolderOpen />
              Pick folder
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,video/*,image/*"
        className="hidden"
        onChange={(event) => event.currentTarget.files && void onImport(event.currentTarget.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => event.currentTarget.files && void onImport(event.currentTarget.files)}
      />

      <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-sm text-stone-400">{status}</p>
    </section>
  );
}

function PresetPanel({ presetId, onPreset }: { presetId: EditPresetId; onPreset: (preset: EditPresetId) => void }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <h2 className="text-xl font-semibold text-stone-50">Editing grammar</h2>
      <p className="mt-1 text-sm text-stone-500">Presets change timing, transitions, motion, and effects.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {editPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPreset(preset.id)}
            className={cn(
              "rounded-lg border p-4 text-left transition hover:border-cyan-300/35",
              presetId === preset.id ? "border-cyan-300/45 bg-cyan-300/[0.075]" : "border-white/10 bg-black/20"
            )}
          >
            <span className="mb-3 block h-1.5 w-16 rounded-full" style={{ backgroundColor: preset.accent }} />
            <span className="block text-sm font-semibold text-stone-100">{preset.name}</span>
            <span className="mt-1 block text-xs leading-5 text-stone-500">{preset.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function AnalysisPanel({ analysis }: { analysis: MusicAnalysis | null }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center gap-2">
        <AudioLines className="size-5 text-cyan-100" />
        <h2 className="text-xl font-semibold text-stone-50">Music analysis</h2>
      </div>
      {analysis ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniStat label="BPM" value={String(analysis.bpm || "--")} />
            <MiniStat label="Beats" value={analysis.beats.length.toString()} />
            <MiniStat label="Sections" value={analysis.sections.length.toString()} />
          </div>
          <div className="h-16 overflow-hidden rounded-md border border-white/10 bg-black/24 p-2">
            <WaveformBars waveform={analysis.waveform} />
          </div>
          <div className="grid gap-2">
            {analysis.sections.slice(0, 8).map((section) => (
              <div key={section.id} className="flex items-center gap-3 rounded-md border border-white/10 bg-black/18 px-3 py-2">
                <span className="mono w-16 text-xs text-cyan-100">{formatTime(section.start)}</span>
                <span className="text-sm text-stone-200">{section.label}</span>
                <span className="ml-auto text-xs text-stone-500">{section.intensity}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-stone-500">Drop an audio file and Infinite Edits will map BPM, beats, transients, energy, waveform, and sections.</p>
      )}
    </section>
  );
}

function MediaBin({
  assets,
  audioAssetId,
  onAnalyzeAgain
}: {
  assets: EditableAsset[];
  audioAssetId?: string;
  onAnalyzeAgain: (asset: EditableAsset) => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <h2 className="mb-4 text-xl font-semibold text-stone-50">Media bin</h2>
      <div className="grid max-h-[36rem] gap-3 overflow-auto pr-1">
        {assets.length ? (
          assets.map((asset) => (
            <div key={asset.id} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-black/22 p-3">
              <div className="grid aspect-square place-items-center overflow-hidden rounded-md border border-white/10 bg-black/30">
                <AssetThumb asset={asset} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-100">{asset.name}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {asset.kind} - {formatBytes(asset.size)}
                  {asset.duration ? ` - ${formatTime(asset.duration)}` : ""}
                </p>
              </div>
              {asset.id === audioAssetId ? (
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[11px] text-cyan-100">score</span>
              ) : asset.kind === "audio" ? (
                <Button size="sm" variant="secondary" onClick={() => onAnalyzeAgain(asset)}>
                  <Waves />
                  Analyze
                </Button>
              ) : null}
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-stone-500">Imported files will appear here.</p>
        )}
      </div>
    </section>
  );
}

function TimelineEditor({
  clips,
  assets,
  analysis,
  currentTime,
  duration,
  zoom,
  selectedClipId,
  timelineRef,
  onSeek,
  onPointerMove,
  onPointerUp,
  onClipPointerDown
}: {
  clips: TimelineClip[];
  assets: EditableAsset[];
  analysis: MusicAnalysis | null;
  currentTime: number;
  duration: number;
  zoom: number;
  selectedClipId: string | null;
  timelineRef: RefObject<HTMLDivElement | null>;
  onSeek: (time: number) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onClipPointerDown: (event: ReactPointerEvent, clip: TimelineClip, mode: DragState["mode"]) => void;
}) {
  const width = Math.max(900, duration * zoom + 120);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-stone-50">Beat timeline</h2>
          <p className="mt-1 text-sm text-stone-500">Drag clips to move them. Pull the edges to trim. Beat snapping is live.</p>
        </div>
        <p className="mono text-sm text-cyan-100">{formatTime(currentTime)}</p>
      </div>

      <div
        ref={timelineRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          onSeek((event.clientX - rect.left + event.currentTarget.scrollLeft) / zoom);
        }}
        className="relative overflow-auto rounded-lg border border-white/10 bg-black/28"
      >
        <div className="relative min-h-96" style={{ width }}>
          <TimelineRuler duration={duration} zoom={zoom} analysis={analysis} />
          <div className="absolute bottom-0 top-0 w-px bg-cyan-200 shadow-[0_0_18px_rgba(99,230,226,0.8)]" style={{ left: currentTime * zoom }} />

          <div className="absolute inset-x-0 top-24 h-64">
            {[0, 1].map((track) => (
              <div key={track} className="absolute left-0 right-0 h-28 border-t border-white/8" style={{ top: track * 126 }}>
                {clips
                  .filter((clip) => clip.track === track)
                  .map((clip) => {
                    const asset = assets.find((item) => item.id === clip.assetId);
                    return (
                      <div
                        key={clip.id}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(event) => onClipPointerDown(event, clip, "move")}
                        className={cn(
                          "absolute top-4 flex h-20 cursor-grab items-center gap-3 overflow-hidden rounded-md border bg-white/[0.065] p-2 text-left shadow-lg transition active:cursor-grabbing",
                          selectedClipId === clip.id ? "border-cyan-300/60" : "border-white/12"
                        )}
                        style={{ left: clip.start * zoom, width: Math.max(36, clip.duration * zoom) }}
                      >
                        <button
                          type="button"
                          aria-label="Trim start"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            onClipPointerDown(event, clip, "trim-start");
                          }}
                          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize bg-cyan-300/35"
                        />
                        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-black/30">
                          {asset ? <AssetThumb asset={asset} /> : <Film className="size-5 text-stone-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-stone-100">{clip.assetName}</p>
                          <p className="mt-1 text-[11px] text-stone-500">
                            {clip.transition} - {formatTime(clip.duration)}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Trim end"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            onClipPointerDown(event, clip, "trim-end");
                          }}
                          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-rose-300/35"
                        />
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineRuler({ duration, zoom, analysis }: { duration: number; zoom: number; analysis: MusicAnalysis | null }) {
  const seconds = Array.from({ length: Math.ceil(duration) + 1 }, (_, index) => index);

  return (
    <>
      <div className="absolute left-0 right-0 top-0 h-16 border-b border-white/10 bg-black/24">
        {seconds.map((second) => (
          <div key={second} className="absolute top-0 h-full border-l border-white/8 pl-1" style={{ left: second * zoom }}>
            <span className="mono text-[10px] text-stone-600">{second}s</span>
          </div>
        ))}
        {analysis?.beats.map((beat) => (
          <div
            key={beat.index}
            className="absolute bottom-0 w-px bg-cyan-300/40"
            style={{ left: beat.time * zoom, height: beat.strength > 0.8 ? 42 : 24 }}
          />
        ))}
      </div>
      <div className="absolute left-0 right-0 top-16 h-8 border-b border-white/10">
        {analysis?.sections.map((section) => (
          <div
            key={section.id}
            className="absolute top-0 flex h-full items-center border-r border-white/10 bg-white/[0.035] px-2"
            style={{ left: section.start * zoom, width: Math.max(28, (section.end - section.start) * zoom) }}
          >
            <span className="truncate text-[11px] text-stone-400">{section.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function AssetThumb({ asset }: { asset: EditableAsset }) {
  if (asset.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={asset.url} alt="" className="h-full w-full object-cover" />;
  }
  if (asset.kind === "video") {
    return <video src={asset.url} muted className="h-full w-full object-cover" />;
  }
  return <FileAudio className="size-5 text-cyan-100" />;
}

function WaveformBars({ waveform }: { waveform: number[] }) {
  return (
    <div className="flex h-full items-center gap-px">
      {waveform.map((value, index) => (
        <span
          key={`${index}-${value}`}
          className="flex-1 rounded-full bg-cyan-200/75"
          style={{ height: `${Math.max(8, value * 100)}%` }}
        />
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/24 p-3">
      <p className="mono text-lg text-cyan-100">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-stone-500">{label}</p>
    </div>
  );
}

async function createAsset(file: File): Promise<EditableAsset> {
  const kind = classifyFile(file);
  if (!kind) throw new Error(`${file.name} is not a supported media file.`);

  const base = {
    id: `${Date.now()}-${crypto.randomUUID()}`,
    name: file.webkitRelativePath || file.name,
    kind,
    type: file.type,
    size: file.size,
    url: URL.createObjectURL(file)
  };

  if (kind === "image") return { ...base, ...(await imageSize(base.url)) };
  if (kind === "video") return { ...base, ...(await videoInfo(base.url)) };
  return base;
}

async function analyzeAudio(file: File, asset: EditableAsset) {
  const buffer = await decodeAudioFile(file);
  const analysis = analyzeAudioBufferForEdits(buffer);
  asset.duration = analysis.duration;
  return analysis;
}

function classifyFile(file: File): MediaKind | null {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && ["mp3", "wav", "flac", "ogg", "aac", "m4a"].includes(extension)) return "audio";
  if (extension && ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(extension)) return "image";
  if (extension && ["mp4", "mov", "webm", "mkv", "avi"].includes(extension)) return "video";
  return null;
}

function imageSize(url: string) {
  return new Promise<Pick<EditableAsset, "width" | "height">>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({});
    image.src = url;
  });
}

function videoInfo(url: string) {
  return new Promise<Pick<EditableAsset, "width" | "height" | "duration">>((resolve) => {
    const video = document.createElement("video");
    video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
    video.onerror = () => resolve({});
    video.src = url;
  });
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
