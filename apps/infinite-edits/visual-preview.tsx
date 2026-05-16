"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import type { EditableAsset, EditPreset, MusicAnalysis, TimelineClip } from "@/types/infinite-edits";

type VisualPreviewProps = {
  asset?: EditableAsset;
  preset: EditPreset;
  analysis: MusicAnalysis | null;
  activeClip?: TimelineClip;
  playing: boolean;
  currentTime: number;
};

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uTexture;
uniform float uHasTexture;
uniform float uTime;
uniform float uEnergy;
uniform float uBloom;
uniform float uChromatic;
uniform float uRgbSplit;
uniform float uCrt;
uniform float uVhs;
uniform float uShake;
uniform float uZoomPulse;
uniform float uScanlines;
uniform float uGlitch;
uniform float uHaze;
uniform float uWarmth;
uniform float uContrast;
uniform vec3 uAccent;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 fallbackScene(vec2 uv) {
  vec2 centered = uv - 0.5;
  float radius = length(centered);
  float rings = sin(radius * 38.0 - uTime * (1.0 + uEnergy * 4.0));
  vec3 base = mix(vec3(0.03, 0.035, 0.055), uAccent * 0.55, smoothstep(0.8, 0.0, radius));
  base += rings * 0.025 * (0.4 + uEnergy);
  base += vec3(0.04, 0.015, 0.04) * sin((uv.x + uv.y + uTime * 0.08) * 8.0);
  return base;
}

void main() {
  vec2 uv = vUv;
  float shake = uShake * uEnergy * 0.01;
  uv += vec2(sin(uTime * 21.0), cos(uTime * 17.0)) * shake;
  uv = (uv - 0.5) / (1.0 + uZoomPulse * uEnergy * 0.045) + 0.5;

  float tear = step(0.988 - uGlitch * 0.08, hash(vec2(floor(uv.y * 44.0), floor(uTime * 18.0))));
  uv.x += tear * (hash(vec2(uv.y, uTime)) - 0.5) * uGlitch * 0.12;

  vec3 color;
  if (uHasTexture > 0.5) {
    float split = (uChromatic + uRgbSplit) * 0.006 * (0.4 + uEnergy);
    float r = texture2D(uTexture, uv + vec2(split, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(split, 0.0)).b;
    color = vec3(r, g, b);
  } else {
    color = fallbackScene(uv);
  }

  color = (color - 0.5) * (1.0 + uContrast * 0.85) + 0.5;
  color.r += uWarmth * 0.1;
  color.b -= uWarmth * 0.055;

  float scan = sin(uv.y * 1200.0) * 0.5 + 0.5;
  color *= 1.0 - scan * uScanlines * 0.14;

  float noise = hash(uv * vec2(580.0, 320.0) + uTime);
  color += (noise - 0.5) * uVhs * 0.12;

  vec2 curve = (uv - 0.5) * 2.0;
  float vignette = smoothstep(1.15, 0.18, dot(curve, curve));
  color *= mix(1.0, vignette, 0.42 + uCrt * 0.24);
  color += uAccent * uBloom * uEnergy * 0.16;
  color = mix(color, color + vec3(0.06, 0.07, 0.09), uHaze * 0.36);

  gl_FragColor = vec4(color, 1.0);
}
`;

export function VisualPreview({ asset, preset, analysis, activeClip, playing, currentTime }: VisualPreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const host = mount;
    startRef.current = performance.now();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: new THREE.Texture() },
        uHasTexture: { value: 0 },
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uBloom: { value: 0 },
        uChromatic: { value: 0 },
        uRgbSplit: { value: 0 },
        uCrt: { value: 0 },
        uVhs: { value: 0 },
        uShake: { value: 0 },
        uZoomPulse: { value: 0 },
        uScanlines: { value: 0 },
        uGlitch: { value: 0 },
        uHaze: { value: 0 },
        uWarmth: { value: 0 },
        uContrast: { value: 0 },
        uAccent: { value: new THREE.Color("#63e6e2") }
      }
    });
    materialRef.current = material;
    scene.add(new THREE.Mesh(geometry, material));

    function resize() {
      const width = host.clientWidth || 960;
      const height = host.clientHeight || 540;
      renderer.setSize(width, height, false);
    }

    let frame = 0;
    function render() {
      resize();
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = (performance.now() - startRef.current) / 1000;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    }

    render();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      textureRef.current?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      materialRef.current = null;
    };
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uBloom.value = activeClip?.effects.bloom ?? preset.effects.bloom;
    material.uniforms.uChromatic.value = activeClip?.effects.chromatic ?? preset.effects.chromatic;
    material.uniforms.uRgbSplit.value = activeClip?.effects.rgbSplit ?? preset.effects.rgbSplit;
    material.uniforms.uCrt.value = activeClip?.effects.crt ?? preset.effects.crt;
    material.uniforms.uVhs.value = activeClip?.effects.vhs ?? preset.effects.vhs;
    material.uniforms.uShake.value = activeClip?.effects.shake ?? preset.effects.shake;
    material.uniforms.uZoomPulse.value = activeClip?.effects.zoomPulse ?? preset.effects.zoomPulse;
    material.uniforms.uScanlines.value = activeClip?.effects.scanlines ?? preset.effects.scanlines;
    material.uniforms.uGlitch.value = activeClip?.effects.glitch ?? preset.effects.glitch;
    material.uniforms.uHaze.value = activeClip?.effects.haze ?? preset.effects.haze;
    material.uniforms.uWarmth.value = activeClip?.effects.warmth ?? preset.effects.warmth;
    material.uniforms.uContrast.value = activeClip?.effects.contrast ?? preset.effects.contrast;
    material.uniforms.uAccent.value = new THREE.Color(preset.accent);
  }, [preset, activeClip]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    let frameEnergy = 0;
    if (analysis?.energyFrames.length) {
      frameEnergy = analysis.energyFrames.reduce((nearest, frame) => {
        return Math.abs(frame.time - currentTime) < Math.abs(nearest.time - currentTime) ? frame : nearest;
      }, analysis.energyFrames[0]).value;
    }
    material.uniforms.uEnergy.value = Math.max(activeClip?.intensity ?? 0, frameEnergy ?? 0.18);
  }, [analysis, currentTime, activeClip]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    textureRef.current?.dispose();
    textureRef.current = null;
    videoRef.current?.pause();
    videoRef.current = null;
    material.uniforms.uHasTexture.value = 0;

    if (!asset || asset.kind === "audio") return;

    if (asset.kind === "image") {
      new THREE.TextureLoader().load(asset.url, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        textureRef.current = texture;
        material.uniforms.uTexture.value = texture;
        material.uniforms.uHasTexture.value = 1;
      });
      return;
    }

    const video = document.createElement("video");
    video.src = asset.url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    videoRef.current = video;
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = texture;
    material.uniforms.uTexture.value = texture;
    material.uniforms.uHasTexture.value = 1;
    if (playing) void video.play().catch(() => undefined);

    return () => {
      video.pause();
      texture.dispose();
    };
  }, [asset, playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [playing]);

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-white/10 bg-black/40 md:min-h-[420px]">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 text-xs text-stone-300">
        <span className="mono rounded-full border border-white/10 bg-black/40 px-3 py-1">{preset.name}</span>
        <span className="mono rounded-full border border-white/10 bg-black/40 px-3 py-1">
          {activeClip ? activeClip.transition : "reactive preview"}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <p className="text-sm font-medium text-stone-100">{asset?.name || "Import visuals to drive the preview"}</p>
        <p className="mt-1 text-xs text-stone-500">
          WebGL FX: bloom, RGB split, CRT scanlines, VHS noise, glitch slicing, zoom pulse, haze
        </p>
      </div>
    </div>
  );
}
