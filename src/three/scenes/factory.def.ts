import { ENTER, REVEAL } from '../../content/timeline';
import { lerp, smooth } from '../../lib/math';
import { lookFrom, mixLook, samplePath, type CamKey, type SceneDef } from '../core/types';

/** Factory layout, in metres. The hall runs from the front wall (z = 0) back along -z. */
export const FACTORY = {
  halfW: 22,
  depth: 88,
  height: 13,
  door: { w: 10, h: 7.2 },
  stationX: -8,
  stationZ: [-16, -30, -44, -58, -72] as const,
  /** Height of the bearers every station module rests on. */
  bearer: 0.35,
};

const [z1, z2, z3, z4, z5] = FACTORY.stationZ;
const SX = FACTORY.stationX;
const h = 0.045;
const s = ENTER.stations;

const station = (i: number, z: number): CamKey[] => [
  { at: s[i] - h, pos: [6, 2.8, z + 11], look: [SX, 1.7, z] },
  { at: s[i] + h, pos: [5.2, 2.9, z + 9.4], look: [SX, 1.7, z], ease: 'linear' },
];

const KEYS: CamKey[] = [
  { at: 0, pos: [-30, 2.3, 80], look: [0, 3.1, 0], fov: 30 },
  { at: 0.1, pos: [-10, 2.6, 46], look: [0, 4, 0], fov: 32 },
  { at: 0.165, pos: [0.6, 2.7, 15], look: [1.5, 3.2, -20], fov: 36 },
  { at: 0.215, pos: [5, 3, -2], look: [-3, 2.8, -30], fov: 38 },
  { at: 0.29, pos: [5, 3, -5.5], look: [-4, 2.6, -32], fov: 38, ease: 'linear' },
  ...station(0, z1),
  ...station(1, z2),
  ...station(2, z3),
  ...station(3, z4),
  ...station(4, z5),
  { at: 1, pos: [SX + 10, 2.6, z5 + 10], look: [SX, 1.8, z5], fov: 34 },
];

const EXTERIOR = lookFrom({
  bg: '#1a2b37',
  fog: [80, 330],
  hemi: ['#6f8ea4', '#0b1216', 0.62],
  key: ['#a9c0d2', 1.0, [-0.55, 0.8, 0.7]],
  fill: ['#b7a694', 0.28, [0.2, 0.3, -1]],
  env: 0.28,
  exposure: 1.06,
  shadow: 46,
});
EXTERIOR.focus.set(0, 0, 18);
EXTERIOR.lampA.pos.set(0, 5.5, 5);
EXTERIOR.lampA.color.set('#ffcf9a');
EXTERIOR.lampA.intensity = 70;
EXTERIOR.lampA.distance = 46;
EXTERIOR.lampB.pos.set(20, 6, 18);
EXTERIOR.lampB.color.set('#dfeaf0');
EXTERIOR.lampB.intensity = 40;
EXTERIOR.lampB.distance = 34;

const INTERIOR = lookFrom({
  bg: '#0c1921',
  fog: [22, 92],
  hemi: ['#aebfc9', '#10191f', 0.5],
  key: ['#fff1de', 2.5, [-0.3, 1, 0.34]],
  fill: ['#8db0c6', 0.5, [0.7, 0.4, 0.5]],
  env: 0.42,
  exposure: 1.12,
  shadow: 20,
});
INTERIOR.lampA.color.set('#ffdcb4');
INTERIOR.lampA.intensity = 44;
INTERIOR.lampA.distance = 26;
INTERIOR.lampB.color.set('#dfeaf0');
INTERIOR.lampB.intensity = 18;
INTERIOR.lampB.distance = 30;

/** The hall recedes and the finished module is isolated in a pool of light. */
const ISOLATED = lookFrom({
  bg: '#0b1720',
  fog: [13, 44],
  hemi: ['#9db3c2', '#0f181d', 0.42],
  key: ['#fff0dc', 2.6, [0.42, 1, 0.5]],
  fill: ['#86a9c0', 0.5, [-0.8, 0.3, 0.2]],
  env: 0.34,
  exposure: 1.12,
  shadow: 9,
});
ISOLATED.focus.set(SX, 0, z5);
ISOLATED.lampA.pos.set(SX + 0.5, 2.4, z5 + 0.2);
ISOLATED.lampA.color.set('#ffd2a0');
ISOLATED.lampA.intensity = 0;
ISOLATED.lampA.distance = 9;
ISOLATED.lampB.pos.set(SX, 8, z5);
ISOLATED.lampB.intensity = 0;

/** Progress of the sectional cut during the reveal chapter. */
export const revealCut = (p: number) => smooth(p, REVEAL.cut[0], REVEAL.cut[1]);

export const factoryDef: SceneDef = {
  id: 'factory',

  pose(ctx, out) {
    if (ctx.chapter === 'reveal') {
      const t = smooth(ctx.p, 0.04, 1);
      const angle = lerp(Math.PI / 4, 0.36, t);
      const radius = lerp(14.14, ctx.compact ? 13 : 12.4, t);
      out.pos.set(SX + Math.cos(angle) * radius, lerp(2.6, 6.2, t), z5 + Math.sin(angle) * radius);
      out.look.set(SX, lerp(1.8, 1.45, t), z5);
      out.fov = 34;
      out.shiftX = ctx.compact ? 0 : 0.13;
      out.shiftY = ctx.compact ? 0.15 : 0.02;
      out.sway = 0.1;
      out.fit = 0.55;
      return;
    }
    samplePath(KEYS, ctx.p, out);
    const inside = smooth(ctx.p, 0.15, 0.22);
    out.shiftX = ctx.compact ? 0 : lerp(0.13, 0.15, inside);
    out.shiftY = ctx.compact ? lerp(0.07, 0.16, inside) : lerp(0.03, 0, inside);
    out.sway = lerp(0.55, 0.1, inside);
    out.fit = lerp(0.75, 0.5, inside);
  },

  look(ctx, out) {
    if (ctx.chapter === 'reveal') {
      INTERIOR.focus.set(SX, 0, z5);
      INTERIOR.lampA.pos.set(SX + 4, 4.5, z5 + 5);
      INTERIOR.lampB.pos.set(SX, 8, z5);
      ISOLATED.lampA.intensity = 16 * smooth(ctx.p, 0.7, 0.9);
      mixLook(out, INTERIOR, ISOLATED, smooth(ctx.p, 0.0, 0.2));
      return;
    }
    // Light follows the camera down the hall.
    const z = lerp(-8, z5, smooth(ctx.p, 0.2, 0.92));
    INTERIOR.focus.set(SX, 0, z);
    INTERIOR.lampA.pos.set(SX + 4, 4.5, z + 5);
    INTERIOR.lampB.pos.set(SX, 8, z);
    mixLook(out, EXTERIOR, INTERIOR, smooth(ctx.p, 0.14, 0.2));
  },
};
