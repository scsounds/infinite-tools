import type { EditPreset, EditPresetId } from "@/types/infinite-edits";

export const editPresets: EditPreset[] = [
  {
    id: "dubstep",
    name: "Dubstep",
    description: "Aggressive impact cuts, stutters, RGB tearing, and heavy beat sync.",
    accent: "#63e6e2",
    pacing: 0.94,
    minBeatsPerClip: 1,
    maxBeatsPerClip: 2,
    transitionRate: 0.35,
    stutterRate: 0.42,
    movement: "hard",
    effects: {
      bloom: 0.32,
      chromatic: 0.68,
      rgbSplit: 0.88,
      crt: 0.28,
      vhs: 0.22,
      shake: 0.74,
      zoomPulse: 0.86,
      scanlines: 0.22,
      glitch: 0.86,
      haze: 0.05,
      warmth: 0.1,
      contrast: 0.82
    }
  },
  {
    id: "future-bass",
    name: "Future Bass",
    description: "Dreamy bloom, emotional swells, smooth movement, and floating cuts.",
    accent: "#ff8bd6",
    pacing: 0.58,
    minBeatsPerClip: 2,
    maxBeatsPerClip: 4,
    transitionRate: 0.62,
    stutterRate: 0.08,
    movement: "float",
    effects: {
      bloom: 0.88,
      chromatic: 0.34,
      rgbSplit: 0.22,
      crt: 0.08,
      vhs: 0.1,
      shake: 0.18,
      zoomPulse: 0.52,
      scanlines: 0.04,
      glitch: 0.12,
      haze: 0.46,
      warmth: 0.34,
      contrast: 0.34
    }
  },
  {
    id: "lofi",
    name: "Lofi",
    description: "CRT texture, tape softness, analog degradation, and slower pacing.",
    accent: "#ffd166",
    pacing: 0.34,
    minBeatsPerClip: 4,
    maxBeatsPerClip: 8,
    transitionRate: 0.48,
    stutterRate: 0.03,
    movement: "drift",
    effects: {
      bloom: 0.28,
      chromatic: 0.18,
      rgbSplit: 0.14,
      crt: 0.68,
      vhs: 0.72,
      shake: 0.09,
      zoomPulse: 0.18,
      scanlines: 0.62,
      glitch: 0.12,
      haze: 0.36,
      warmth: 0.72,
      contrast: 0.28
    }
  },
  {
    id: "folk",
    name: "Folk",
    description: "Warm cinematic softness, handheld drift, and longer emotional holds.",
    accent: "#8ee6a7",
    pacing: 0.26,
    minBeatsPerClip: 6,
    maxBeatsPerClip: 12,
    transitionRate: 0.36,
    stutterRate: 0,
    movement: "handheld",
    effects: {
      bloom: 0.34,
      chromatic: 0.08,
      rgbSplit: 0.02,
      crt: 0.06,
      vhs: 0.16,
      shake: 0.08,
      zoomPulse: 0.12,
      scanlines: 0,
      glitch: 0,
      haze: 0.26,
      warmth: 0.86,
      contrast: 0.22
    }
  },
  {
    id: "phonk",
    name: "Phonk",
    description: "Dark grading, VHS noise, drift movement, and hard contrast.",
    accent: "#ff6b9a",
    pacing: 0.78,
    minBeatsPerClip: 1,
    maxBeatsPerClip: 4,
    transitionRate: 0.28,
    stutterRate: 0.22,
    movement: "hard",
    effects: {
      bloom: 0.22,
      chromatic: 0.52,
      rgbSplit: 0.42,
      crt: 0.28,
      vhs: 0.74,
      shake: 0.46,
      zoomPulse: 0.54,
      scanlines: 0.34,
      glitch: 0.48,
      haze: 0.12,
      warmth: 0.18,
      contrast: 0.92
    }
  },
  {
    id: "ambient",
    name: "Ambient",
    description: "Slow transitions, haze, minimal cuts, and atmospheric pacing.",
    accent: "#93b7ff",
    pacing: 0.14,
    minBeatsPerClip: 8,
    maxBeatsPerClip: 16,
    transitionRate: 0.74,
    stutterRate: 0,
    movement: "slow",
    effects: {
      bloom: 0.48,
      chromatic: 0.14,
      rgbSplit: 0.04,
      crt: 0.08,
      vhs: 0.12,
      shake: 0,
      zoomPulse: 0.08,
      scanlines: 0.04,
      glitch: 0.02,
      haze: 0.78,
      warmth: 0.26,
      contrast: 0.18
    }
  }
];

export function getEditPreset(id: EditPresetId) {
  return editPresets.find((preset) => preset.id === id) || editPresets[0];
}
