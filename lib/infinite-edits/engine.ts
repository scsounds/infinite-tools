import type { EditableAsset, EditPreset, MusicAnalysis, PresetEffectState, TimelineClip } from "@/types/infinite-edits";

type TimelineAsset = Pick<EditableAsset, "id" | "name" | "kind" | "duration">;

export function generateBeatGrid(bpm: number, duration: number) {
  if (!bpm || bpm <= 0 || !duration) return [];
  const interval = 60 / bpm;
  const beats = [];
  for (let time = 0, index = 0; time <= duration; time += interval, index += 1) {
    beats.push({ time, strength: index % 4 === 0 ? 1 : 0.62, index });
  }
  return beats;
}

export function generateTimelineClips(assets: TimelineAsset[], analysis: MusicAnalysis | null, preset: EditPreset): TimelineClip[] {
  const visualAssets = assets.filter(
    (asset): asset is TimelineAsset & { kind: Exclude<TimelineAsset["kind"], "audio"> } => asset.kind !== "audio"
  );
  if (!visualAssets.length) return [];

  const duration = analysis?.duration || 48;
  const beats = analysis?.beats?.length ? analysis.beats : generateBeatGrid(120, duration);
  if (beats.length < 2) return [];

  const clips: TimelineClip[] = [];
  let beatCursor = 0;
  let clipIndex = 0;

  while (beatCursor < beats.length - 1 && beats[beatCursor].time < duration) {
    const beat = beats[beatCursor];
    const section = analysis?.sections.find((item) => beat.time >= item.start && beat.time < item.end);
    const energy = section?.energy ?? beat.strength;
    const beatsPerClip = chooseClipBeatLength(preset, energy, clipIndex);
    const nextBeat = beats[Math.min(beats.length - 1, beatCursor + beatsPerClip)];
    const start = beat.time;
    const nextStart = nextBeat?.time ?? Math.min(duration, start + beatsPerClip * (60 / Math.max(analysis?.bpm || 120, 1)));
    const clipDuration = Math.max(0.2, Math.min(duration - start, nextStart - start));
    if (clipDuration <= 0) break;

    const asset = visualAssets[clipIndex % visualAssets.length];
    const transition = chooseTransition(preset, energy, clipIndex);
    const effects = scaleEffects(preset.effects, energy, transition);
    const sourceDuration = asset.duration && asset.kind === "video" ? asset.duration : clipDuration;
    const maxInPoint = Math.max(0, sourceDuration - clipDuration);
    const inPoint = asset.kind === "video" ? deterministicRange(clipIndex, 0, maxInPoint) : 0;

    clips.push({
      id: `clip-${clipIndex}-${asset.id}`,
      assetId: asset.id,
      assetName: asset.name,
      kind: asset.kind,
      start,
      duration: clipDuration,
      inPoint,
      outPoint: inPoint + clipDuration,
      track: clipIndex % 2,
      sectionId: section?.id,
      beatIndex: beat.index,
      transition,
      effects,
      movement: preset.movement,
      intensity: clamp(energy, 0, 1)
    });

    beatCursor += Math.max(1, beatsPerClip);
    clipIndex += 1;
  }

  return clips;
}

export function snapTimeToBeat(time: number, beats: { time: number }[]) {
  if (!beats.length) return time;
  let nearest = beats[0].time;
  let distance = Math.abs(time - nearest);
  for (const beat of beats) {
    const nextDistance = Math.abs(time - beat.time);
    if (nextDistance < distance) {
      distance = nextDistance;
      nearest = beat.time;
    }
  }
  return nearest;
}

export function timelineDuration(clips: TimelineClip[], fallback = 30) {
  return clips.length ? Math.max(...clips.map((clip) => clip.start + clip.duration)) : fallback;
}

function chooseClipBeatLength(preset: EditPreset, energy: number, index: number) {
  const span = preset.maxBeatsPerClip - preset.minBeatsPerClip;
  const intensityBias = 1 - clamp(energy * preset.pacing, 0, 0.95);
  const seeded = deterministicRange(index + Math.round(energy * 100), 0, 1);
  const beats = preset.minBeatsPerClip + Math.round(span * Math.max(0, intensityBias - seeded * 0.22));
  return clamp(Math.round(beats), preset.minBeatsPerClip, preset.maxBeatsPerClip);
}

function chooseTransition(preset: EditPreset, energy: number, index: number): TimelineClip["transition"] {
  const seeded = deterministicRange(index, 0, 1);
  if (seeded < preset.stutterRate * energy) return "stutter";
  if (preset.effects.glitch > 0.4 && seeded < preset.transitionRate * 0.45) return "glitch";
  if (preset.effects.bloom > 0.5 && seeded < preset.transitionRate) return "bloom";
  if (preset.effects.vhs > 0.45 && seeded < preset.transitionRate) return "tape";
  if (seeded < preset.transitionRate) return "crossfade";
  return "cut";
}

function scaleEffects(effects: PresetEffectState, energy: number, transition: TimelineClip["transition"]) {
  const impact = transition === "glitch" || transition === "stutter" ? 1.22 : transition === "bloom" ? 1.1 : 1;
  const scale = 0.72 + clamp(energy, 0, 1) * 0.48;
  return Object.fromEntries(
    Object.entries(effects).map(([key, value]) => [key, clamp(value * scale * impact, 0, 1)])
  ) as PresetEffectState;
}

function deterministicRange(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 999.13) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
