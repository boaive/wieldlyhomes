import { Color, Vector3 } from 'three';
import type { ChapterId, Tier } from '../../state/stage';
import { clamp, lerp } from '../../lib/math';

export type SceneId = 'factory' | 'module' | 'story' | 'system' | 'config' | 'route' | 'habitat' | 'future';

/** Camera intent for one frame. The rig damps the real camera toward it. */
export interface Pose {
  pos: Vector3;
  look: Vector3;
  fov: number;
  /** Lens shift: where the optical centre sits, as a fraction of the viewport (+x right, +y up). */
  shiftX: number;
  shiftY: number;
  /** Amplitude of idle drift and pointer parallax, in metres. */
  sway: number;
  /** How strongly the camera backs off on narrow viewports (0 = never). */
  fit: number;
}

export interface Lamp {
  pos: Vector3;
  color: Color;
  intensity: number;
  distance: number;
}

/** Atmosphere and lighting for one frame. */
export interface Look {
  bg: Color;
  fogNear: number;
  fogFar: number;
  sky: Color;
  ground: Color;
  hemi: number;
  keyColor: Color;
  key: number;
  keyDir: Vector3;
  fillColor: Color;
  fill: number;
  fillDir: Vector3;
  env: number;
  exposure: number;
  /** Centre and half-size of the shadowed area. */
  focus: Vector3;
  shadow: number;
  lampA: Lamp;
  lampB: Lamp;
}

export interface FrameCtx {
  chapter: ChapterId;
  /** 0→1 travel of the active chapter. */
  p: number;
  time: number;
  aspect: number;
  /** Portrait / narrow viewport — matches the compact CSS layout. */
  compact: boolean;
  /** Landscape viewport below 1100px — matches the two-column CSS layout. */
  mid: boolean;
  tier: Tier;
}

export interface SceneDef {
  id: SceneId;
  pose: (ctx: FrameCtx, out: Pose) => void;
  look: (ctx: FrameCtx, out: Look) => void;
  /** Extra dip-to-dark inside the scene (0–1), e.g. for an internal cut. */
  veil?: (ctx: FrameCtx) => number;
}

export const makePose = (): Pose => ({
  pos: new Vector3(0, 3, 20),
  look: new Vector3(),
  fov: 32,
  shiftX: 0,
  shiftY: 0,
  sway: 0.1,
  fit: 1,
});

const lamp = (): Lamp => ({ pos: new Vector3(), color: new Color('#ffd2a0'), intensity: 0, distance: 20 });

export const makeLook = (): Look => ({
  bg: new Color('#0b1720'),
  fogNear: 30,
  fogFar: 140,
  sky: new Color('#8fa6b4'),
  ground: new Color('#141c20'),
  hemi: 0.5,
  keyColor: new Color('#fff1dc'),
  key: 2,
  keyDir: new Vector3(0.5, 1, 0.4).normalize(),
  fillColor: new Color('#7f9fb4'),
  fill: 0.4,
  fillDir: new Vector3(-0.6, 0.4, -0.5).normalize(),
  env: 0.35,
  exposure: 1,
  focus: new Vector3(),
  shadow: 14,
  lampA: lamp(),
  lampB: lamp(),
});

/** Compact, hex-based description of a look. */
export interface LookSpec {
  bg: string;
  fog: [number, number];
  hemi: [string, string, number];
  key: [string, number, [number, number, number]];
  fill: [string, number, [number, number, number]];
  env: number;
  exposure: number;
  shadow: number;
}

export function lookFrom(spec: LookSpec): Look {
  const l = makeLook();
  l.bg.set(spec.bg);
  l.fogNear = spec.fog[0];
  l.fogFar = spec.fog[1];
  l.sky.set(spec.hemi[0]);
  l.ground.set(spec.hemi[1]);
  l.hemi = spec.hemi[2];
  l.keyColor.set(spec.key[0]);
  l.key = spec.key[1];
  l.keyDir.set(...spec.key[2]).normalize();
  l.fillColor.set(spec.fill[0]);
  l.fill = spec.fill[1];
  l.fillDir.set(...spec.fill[2]).normalize();
  l.env = spec.env;
  l.exposure = spec.exposure;
  l.shadow = spec.shadow;
  return l;
}

const lerpLamp = (out: Lamp, a: Lamp, b: Lamp, t: number) => {
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.color.lerpColors(a.color, b.color, t);
  out.intensity = lerp(a.intensity, b.intensity, t);
  out.distance = lerp(a.distance, b.distance, t);
};

export function mixLook(out: Look, a: Look, b: Look, t: number): Look {
  t = clamp(t);
  out.bg.lerpColors(a.bg, b.bg, t);
  out.fogNear = lerp(a.fogNear, b.fogNear, t);
  out.fogFar = lerp(a.fogFar, b.fogFar, t);
  out.sky.lerpColors(a.sky, b.sky, t);
  out.ground.lerpColors(a.ground, b.ground, t);
  out.hemi = lerp(a.hemi, b.hemi, t);
  out.keyColor.lerpColors(a.keyColor, b.keyColor, t);
  out.key = lerp(a.key, b.key, t);
  out.keyDir.lerpVectors(a.keyDir, b.keyDir, t).normalize();
  out.fillColor.lerpColors(a.fillColor, b.fillColor, t);
  out.fill = lerp(a.fill, b.fill, t);
  out.fillDir.lerpVectors(a.fillDir, b.fillDir, t).normalize();
  out.env = lerp(a.env, b.env, t);
  out.exposure = lerp(a.exposure, b.exposure, t);
  out.focus.lerpVectors(a.focus, b.focus, t);
  out.shadow = lerp(a.shadow, b.shadow, t);
  lerpLamp(out.lampA, a.lampA, b.lampA, t);
  lerpLamp(out.lampB, a.lampB, b.lampB, t);
  return out;
}

export const copyLook = (out: Look, a: Look) => mixLook(out, a, a, 0);

/** A camera keyframe on a 0→1 timeline. */
export interface CamKey {
  at: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov?: number;
  /** Easing of the segment that arrives at this key. */
  ease?: 'smooth' | 'linear';
}

const _a = new Vector3();
const _b = new Vector3();

/** Samples a keyframed camera path into `out`. */
export function samplePath(keys: CamKey[], t: number, out: Pose, defaultFov = 32): void {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].at) i++;
  const k0 = keys[i];
  const k1 = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(1e-5, k1.at - k0.at);
  let u = clamp((t - k0.at) / span);
  if (k1.ease !== 'linear') u = u * u * (3 - 2 * u);
  out.pos.lerpVectors(_a.set(...k0.pos), _b.set(...k1.pos), u);
  out.look.lerpVectors(_a.set(...k0.look), _b.set(...k1.look), u);
  out.fov = lerp(k0.fov ?? defaultFov, k1.fov ?? defaultFov, u);
}
