export type EditPresetId = "dubstep" | "future-bass" | "lofi" | "folk" | "phonk" | "ambient";

export type MediaKind = "audio" | "image" | "video";

export type EditableAsset = {
  id: string;
  name: string;
  kind: MediaKind;
  type: string;
  size: number;
  url: string;
  duration?: number;
  width?: number;
  height?: number;
};

export type BeatMarker = {
  time: number;
  strength: number;
  index: number;
};

export type TransientMarker = {
  time: number;
  strength: number;
};

export type EnergyFrame = {
  time: number;
  value: number;
};

export type MusicSection = {
  id: string;
  label: string;
  start: number;
  end: number;
  energy: number;
  intensity: "low" | "medium" | "high";
};

export type MusicAnalysis = {
  duration: number;
  bpm: number;
  confidence: number;
  beats: BeatMarker[];
  transients: TransientMarker[];
  energyFrames: EnergyFrame[];
  waveform: number[];
  sections: MusicSection[];
};

export type PresetEffectState = {
  bloom: number;
  chromatic: number;
  rgbSplit: number;
  crt: number;
  vhs: number;
  shake: number;
  zoomPulse: number;
  scanlines: number;
  glitch: number;
  haze: number;
  warmth: number;
  contrast: number;
};

export type EditPreset = {
  id: EditPresetId;
  name: string;
  description: string;
  accent: string;
  pacing: number;
  minBeatsPerClip: number;
  maxBeatsPerClip: number;
  transitionRate: number;
  stutterRate: number;
  movement: "hard" | "float" | "drift" | "handheld" | "slow";
  effects: PresetEffectState;
};

export type TimelineClip = {
  id: string;
  assetId: string;
  assetName: string;
  kind: Exclude<MediaKind, "audio">;
  start: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  track: number;
  sectionId?: string;
  beatIndex: number;
  transition: "cut" | "crossfade" | "glitch" | "stutter" | "bloom" | "tape";
  effects: PresetEffectState;
  movement: EditPreset["movement"];
  intensity: number;
};
