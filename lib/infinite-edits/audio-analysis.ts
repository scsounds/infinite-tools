import { generateBeatGrid } from "@/lib/infinite-edits/engine";
import { estimateBpmFromSamples } from "@/lib/processors/audio";
import type { EnergyFrame, MusicAnalysis, MusicSection, TransientMarker } from "@/types/infinite-edits";

export function analyzeAudioBufferForEdits(audioBuffer: AudioBuffer): MusicAnalysis {
  const { samples, sampleRate } = audioBufferToMono(audioBuffer);
  const tempo = estimateBpmFromSamples(samples, sampleRate);
  const energyFrames = buildEnergyFrames(samples, sampleRate, 0.1);
  const transients = detectTransients(energyFrames);
  const waveform = buildWaveform(samples, 192);
  const rawBeats = generateBeatGrid(tempo.bpm || 120, audioBuffer.duration);
  const beats = rawBeats.map((beat) => {
    const nearbyTransient = nearestTransient(beat.time, transients, 0.09);
    const energy = energyAt(beat.time, energyFrames);
    return {
      ...beat,
      strength: Math.max(beat.strength, nearbyTransient?.strength ?? 0, energy * 0.82)
    };
  });
  const sections = detectSections(audioBuffer.duration, energyFrames, transients, tempo.bpm || 120);

  return {
    duration: audioBuffer.duration,
    bpm: tempo.bpm,
    confidence: tempo.confidence,
    beats,
    transients,
    energyFrames,
    waveform,
    sections
  };
}

function audioBufferToMono(audioBuffer: AudioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const sampleCount = audioBuffer.length;
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

function buildEnergyFrames(samples: Float32Array, sampleRate: number, secondsPerFrame: number) {
  const frameSize = Math.max(256, Math.round(sampleRate * secondsPerFrame));
  const frames: EnergyFrame[] = [];
  let peak = 0;

  for (let start = 0; start < samples.length; start += frameSize) {
    let energy = 0;
    for (let index = start; index < Math.min(samples.length, start + frameSize); index += 1) {
      energy += samples[index] * samples[index];
    }
    const value = Math.sqrt(energy / frameSize);
    peak = Math.max(peak, value);
    frames.push({ time: start / sampleRate, value });
  }

  return frames.map((frame) => ({ ...frame, value: peak ? frame.value / peak : 0 }));
}

function detectTransients(frames: EnergyFrame[]) {
  const transients: TransientMarker[] = [];
  const average = frames.reduce((sum, frame) => sum + frame.value, 0) / Math.max(1, frames.length);

  for (let index = 2; index < frames.length - 1; index += 1) {
    const previous = (frames[index - 1].value + frames[index - 2].value) / 2;
    const rise = frames[index].value - previous;
    if (rise > Math.max(0.08, average * 0.42) && frames[index].value > frames[index + 1].value * 0.82) {
      transients.push({
        time: frames[index].time,
        strength: Math.min(1, rise * 2.4 + frames[index].value * 0.44)
      });
    }
  }

  return transients;
}

function detectSections(duration: number, frames: EnergyFrame[], transients: TransientMarker[], bpm: number) {
  const phraseSeconds = Math.max(6, (60 / Math.max(60, bpm)) * 16);
  const sections: MusicSection[] = [];
  let cursor = 0;
  let index = 0;

  while (cursor < duration) {
    const end = Math.min(duration, cursor + phraseSeconds);
    const scopedFrames = frames.filter((frame) => frame.time >= cursor && frame.time < end);
    const scopedTransients = transients.filter((transient) => transient.time >= cursor && transient.time < end);
    const energy = scopedFrames.reduce((sum, frame) => sum + frame.value, 0) / Math.max(1, scopedFrames.length);
    const transientDensity = scopedTransients.length / Math.max(1, end - cursor);
    const combined = Math.min(1, energy * 0.75 + transientDensity * 0.18);
    const intensity = combined > 0.62 ? "high" : combined > 0.34 ? "medium" : "low";
    const label = sectionLabel(index, intensity, cursor, duration);

    sections.push({
      id: `section-${index}`,
      label,
      start: cursor,
      end,
      energy: combined,
      intensity
    });

    cursor = end;
    index += 1;
  }

  return sections;
}

function sectionLabel(index: number, intensity: MusicSection["intensity"], start: number, duration: number) {
  if (index === 0) return "opening";
  if (start > duration * 0.78) return "outro";
  if (intensity === "high") return "impact";
  if (intensity === "medium") return "build";
  return "drift";
}

function buildWaveform(samples: Float32Array, points: number) {
  const step = Math.max(1, Math.floor(samples.length / points));
  const waveform: number[] = [];

  for (let point = 0; point < points; point += 1) {
    let peak = 0;
    for (let offset = 0; offset < step; offset += 1) {
      peak = Math.max(peak, Math.abs(samples[point * step + offset] || 0));
    }
    waveform.push(Math.min(1, peak));
  }

  return waveform;
}

function nearestTransient(time: number, transients: TransientMarker[], tolerance: number) {
  let nearest: TransientMarker | undefined;
  let distance = tolerance;
  for (const transient of transients) {
    const nextDistance = Math.abs(transient.time - time);
    if (nextDistance <= distance) {
      distance = nextDistance;
      nearest = transient;
    }
  }
  return nearest;
}

function energyAt(time: number, frames: EnergyFrame[]) {
  if (!frames.length) return 0;
  let nearest = frames[0];
  let distance = Math.abs(time - nearest.time);
  for (const frame of frames) {
    const nextDistance = Math.abs(time - frame.time);
    if (nextDistance < distance) {
      distance = nextDistance;
      nearest = frame;
    }
  }
  return nearest.value;
}
