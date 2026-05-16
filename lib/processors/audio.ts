export type BpmResult = {
  bpm: number;
  confidence: number;
  candidates: number[];
};

type TempoScore = {
  bpm: number;
  score: number;
};

const tempoMin = 60;
const tempoMax = 200;
const frameSize = 1024;
const hopSize = 512;
const maxAnalysisSeconds = 240;

export async function decodeAudioFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();
  try {
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioContext.close();
  }
}

export async function estimateBpm(file: File): Promise<BpmResult> {
  const audioBuffer = await decodeAudioFile(file);
  const { samples, sampleRate } = audioBufferToMono(audioBuffer);
  return estimateBpmFromSamples(samples, sampleRate);
}

export function estimateBpmFromSamples(samples: Float32Array, sampleRate: number): BpmResult {
  if (!samples.length || sampleRate <= 0) {
    return { bpm: 0, confidence: 0, candidates: [] };
  }

  const onset = buildOnsetEnvelope(samples, sampleRate);
  if (onset.length < 16 || onset.every((value) => value === 0)) {
    return { bpm: 0, confidence: 0, candidates: [] };
  }

  const frameRate = sampleRate / hopSize;
  const coarse = scoreTempoRange(onset, frameRate, tempoMin, tempoMax, 0.25);
  const bestCoarse = resolveTempoOctave(coarse);
  if (!bestCoarse || bestCoarse.score <= 0) {
    return { bpm: 0, confidence: 0, candidates: [] };
  }

  const fineMin = Math.max(tempoMin, bestCoarse.bpm - 1.5);
  const fineMax = Math.min(tempoMax, bestCoarse.bpm + 1.5);
  const fine = scoreTempoRange(onset, frameRate, fineMin, fineMax, 0.05);
  const merged = [...fine, ...coarse].sort((a, b) => b.score - a.score);
  const winner = resolveTempoOctave(merged);
  const candidates = collapseTempoCandidates(merged);
  const bpm = snapTempo(winner.bpm);
  const runnerUp = merged.find((item) => Math.abs(item.bpm - winner.bpm) > 4);
  const clarity = runnerUp ? Math.max(0, (winner.score - runnerUp.score) / Math.max(winner.score, 0.000001)) : 1;
  const confidence = Math.round(clamp(winner.score * 62 + clarity * 38, 0, 98));

  return {
    bpm,
    confidence,
    candidates: candidates.includes(bpm) ? candidates : [bpm, ...candidates].slice(0, 5)
  };
}

export async function drawWaveform(file: File, options: { width: number; height: number; accent: string; background: string }) {
  const audioBuffer = await decodeAudioFile(file);
  const data = audioBuffer.getChannelData(0);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(clamp(options.width, 320, 4096));
  canvas.height = Math.round(clamp(options.height, 120, 2048));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available in this browser.");

  context.fillStyle = options.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = options.accent;
  context.lineWidth = 2;
  context.beginPath();

  const step = Math.ceil(data.length / canvas.width);
  const middle = canvas.height / 2;
  for (let x = 0; x < canvas.width; x += 1) {
    let min = 1;
    let max = -1;
    for (let i = 0; i < step; i += 1) {
      const sample = data[x * step + i] || 0;
      min = Math.min(min, sample);
      max = Math.max(max, sample);
    }
    context.moveTo(x, middle + min * middle * 0.88);
    context.lineTo(x, middle + max * middle * 0.88);
  }
  context.stroke();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Could not render waveform."))), "image/png");
  });

  return {
    blob,
    url: URL.createObjectURL(blob),
    duration: audioBuffer.duration,
    width: canvas.width,
    height: canvas.height
  };
}

function audioBufferToMono(audioBuffer: AudioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const sampleCount = Math.min(audioBuffer.length, Math.round(sampleRate * maxAnalysisSeconds));
  const samples = new Float32Array(sampleCount);
  const channelCount = Math.max(1, audioBuffer.numberOfChannels);

  for (let channel = 0; channel < channelCount; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let index = 0; index < sampleCount; index += 1) {
      samples[index] += data[index] / channelCount;
    }
  }

  return { samples, sampleRate };
}

function buildOnsetEnvelope(samples: Float32Array, sampleRate: number) {
  const frameCount = Math.max(0, Math.floor((samples.length - frameSize) / hopSize));
  const raw = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * hopSize;
    let energy = 0;
    let transient = 0;
    let previous = samples[start] || 0;

    for (let offset = 0; offset < frameSize; offset += 1) {
      const sample = samples[start + offset] || 0;
      const diff = sample - previous;
      energy += sample * sample;
      if (diff > 0) transient += diff * diff;
      previous = sample;
    }

    const rms = Math.sqrt(energy / frameSize);
    const attack = Math.sqrt(transient / frameSize);
    raw[frame] = Math.log1p((rms + attack * 1.25) * 80);
  }

  const novelty = new Float32Array(raw.length);
  const localWindow = Math.max(8, Math.round(sampleRate / hopSize / 5));
  for (let index = 1; index < raw.length; index += 1) {
    const start = Math.max(0, index - localWindow);
    let local = 0;
    for (let cursor = start; cursor < index; cursor += 1) local += raw[cursor];
    local /= Math.max(1, index - start);
    novelty[index] = Math.max(0, raw[index] - local * 0.96);
  }

  return normalizeEnvelope(novelty);
}

function normalizeEnvelope(values: Float32Array) {
  const sorted = Array.from(values).sort((a, b) => a - b);
  const clip = sorted[Math.floor(sorted.length * 0.985)] || 1;
  const normalized = new Float32Array(values.length);
  for (let index = 0; index < values.length; index += 1) {
    normalized[index] = Math.min(values[index] / clip, 1.4);
  }

  const smoothed = new Float32Array(values.length);
  for (let index = 1; index < normalized.length - 1; index += 1) {
    smoothed[index] = normalized[index - 1] * 0.2 + normalized[index] * 0.6 + normalized[index + 1] * 0.2;
  }
  return smoothed;
}

function scoreTempoRange(onset: Float32Array, frameRate: number, min: number, max: number, step: number) {
  const scores: TempoScore[] = [];
  for (let bpm = min; bpm <= max; bpm += step) {
    const lag = (60 / bpm) * frameRate;
    const score =
      correlationAtLag(onset, lag) * 0.72 +
      correlationAtLag(onset, lag * 2) * 0.2 +
      correlationAtLag(onset, lag * 3) * 0.08;
    scores.push({ bpm, score });
  }
  return scores.sort((a, b) => b.score - a.score);
}

function correlationAtLag(onset: Float32Array, lag: number) {
  const start = Math.ceil(lag);
  if (start >= onset.length - 1) return 0;

  let cross = 0;
  let left = 0;
  let right = 0;

  for (let index = start; index < onset.length; index += 1) {
    const a = onset[index];
    const b = sampleLinear(onset, index - lag);
    cross += a * b;
    left += a * a;
    right += b * b;
  }

  return cross / (Math.sqrt(left * right) + 0.000001);
}

function sampleLinear(values: Float32Array, position: number) {
  if (position <= 0) return values[0] || 0;
  const index = Math.floor(position);
  if (index >= values.length - 1) return values[values.length - 1] || 0;
  const fraction = position - index;
  return values[index] * (1 - fraction) + values[index + 1] * fraction;
}

function collapseTempoCandidates(scores: TempoScore[]) {
  const candidates: number[] = [];
  for (const score of scores) {
    const rounded = snapTempo(score.bpm);
    if (!candidates.some((candidate) => Math.abs(candidate - rounded) <= 2)) {
      candidates.push(rounded);
    }
    if (candidates.length === 5) break;
  }
  return candidates;
}

function resolveTempoOctave(scores: TempoScore[]) {
  const winner = scores[0];
  if (!winner) return winner;

  if (winner.bpm < 80) {
    const doubled = findNearestTempo(scores, winner.bpm * 2);
    if (doubled && doubled.score >= winner.score * 0.25) return doubled;
  }

  return winner;
}

function findNearestTempo(scores: TempoScore[], bpm: number) {
  let nearest: TempoScore | undefined;
  for (const score of scores) {
    if (Math.abs(score.bpm - bpm) > 0.55) continue;
    if (!nearest || score.score > nearest.score) nearest = score;
  }
  return nearest;
}

function snapTempo(bpm: number) {
  const rounded = Math.round(bpm);
  if (Math.abs(bpm - rounded) < 0.35) return rounded;
  return Math.round(bpm * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
