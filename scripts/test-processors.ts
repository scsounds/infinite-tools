import assert from "node:assert/strict";

import { estimateBpmFromSamples } from "../lib/processors/audio.ts";
import { crc32 } from "../lib/processors/hash.ts";
import { cleanHashtags, countText, formatTimestamp, shiftSubtitleTimestamps } from "../lib/processors/text.ts";

const sampleRate = 44_100;

for (const bpm of [90, 120, 128, 140, 174]) {
  const result = estimateBpmFromSamples(makeClickTrack(bpm), sampleRate);
  assertWithin(result.bpm, bpm, 1, `${bpm} BPM click track`);
  assert.ok(result.confidence >= 45, `${bpm} BPM should produce a usable confidence score, got ${result.confidence}`);
}

const subdivided = estimateBpmFromSamples(makeClickTrack(140, { subdivisions: true }), sampleRate);
assertWithin(subdivided.bpm, 140, 1, "140 BPM with eighth-note subdivisions");

assert.deepEqual(cleanHashtags("#Music, music #Studio!! full-circle", 10), ["#music", "#studio", "#fullcircle"]);
assert.equal(countText("hello world\nagain").words, 3);
assert.equal(
  shiftSubtitleTimestamps("1\n00:00:01,000 --> 00:00:02,000\nHello", 1.5, "srt"),
  "1\n00:00:02,500 --> 00:00:03,500\nHello"
);
assert.equal(
  shiftSubtitleTimestamps("00:00:01,000 --> 00:00:02,000\nHello, world", 0, "vtt"),
  "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello, world"
);
assert.equal(formatTimestamp(1.9996, ","), "00:00:02,000");
assert.equal(crc32(new TextEncoder().encode("123456789").buffer), "cbf43926");

console.log("processor tests passed");

function makeClickTrack(bpm: number, options: { duration?: number; subdivisions?: boolean } = {}) {
  const duration = options.duration ?? 36;
  const samples = new Float32Array(Math.round(duration * sampleRate));
  const beatSeconds = 60 / bpm;

  for (let beat = 0; beat * beatSeconds < duration; beat += 1) {
    addKick(samples, Math.round(beat * beatSeconds * sampleRate), beat % 4 === 0 ? 1 : 0.78);
    if (options.subdivisions) {
      addHat(samples, Math.round((beat * beatSeconds + beatSeconds / 2) * sampleRate), 0.14);
    }
  }

  return samples;
}

function addKick(samples: Float32Array, start: number, amp: number) {
  const length = Math.round(sampleRate * 0.09);
  for (let offset = 0; offset < length && start + offset < samples.length; offset += 1) {
    const t = offset / sampleRate;
    const envelope = Math.exp(-t * 42);
    const tone = Math.sin(2 * Math.PI * 78 * t);
    const click = offset < 80 ? 1 - offset / 80 : 0;
    samples[start + offset] += amp * (tone * envelope + click * 0.55);
  }
}

function addHat(samples: Float32Array, start: number, amp: number) {
  const length = Math.round(sampleRate * 0.025);
  for (let offset = 0; offset < length && start + offset < samples.length; offset += 1) {
    const t = offset / sampleRate;
    const pseudoNoise = Math.sin(offset * 12.9898) * 43758.5453;
    const noise = pseudoNoise - Math.floor(pseudoNoise);
    samples[start + offset] += amp * (noise * 2 - 1) * Math.exp(-t * 120);
  }
}

function assertWithin(actual: number, expected: number, tolerance: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}
