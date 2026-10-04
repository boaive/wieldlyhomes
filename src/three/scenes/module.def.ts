import { WHY } from '../../content/timeline';
import { clamp, lerp, ramp } from '../../lib/math';
import { scroll } from '../../state/stage';
import { copyLook, lookFrom, samplePath, type CamKey, type SceneDef } from '../core/types';

/** Local 0→1 progress of Why-Wieldy beat `i`, and a soft in/out window for it. */
export const whyLocal = (p: number, i: number) => {
  const span = (WHY.end - WHY.start) / WHY.count;
  return (p - WHY.start - i * span) / span;
};

export const whyWindow = (p: number, i: number, edge = 0.14) => {
  const u = whyLocal(p, i);
  if (u <= 0 || u >= 1) return 0;
  const k = Math.min(u, 1 - u) / edge;
  const t = clamp(k);
  return t * t * (3 - 2 * t);
};

const span = (WHY.end - WHY.start) / WHY.count;
const at = (i: number, u = 0.5) => WHY.start + (i + u) * span;

const KEYS: CamKey[] = [
  { at: 0, pos: [12.5, 4.6, 14.5], look: [0, 1.75, 0] },
  { at: at(0), pos: [11, 4.4, 13.5], look: [0, 1.75, 0] },
  { at: at(1), pos: [9.4, 3.6, 12.2], look: [0, 1.7, 0] },
  { at: at(2), pos: [13.5, 5.2, 15], look: [1.2, 1.7, 0] },
  { at: at(3), pos: [11.5, 3.2, 14.5], look: [0, 3.0, 0] },
  { at: at(4, 0.6), pos: [22, 9, 30], look: [0, 7.6, 0] },
  { at: at(5, 0.45), pos: [10, 3.3, 14.5], look: [0, 1.9, 1.2] },
  { at: 1, pos: [9.2, 3.1, 13.6], look: [0, 1.9, 1.2] },
];

const STUDIO = lookFrom({
  bg: '#0b1720',
  fog: [22, 78],
  hemi: ['#93abbb', '#0e171c', 0.5],
  key: ['#fff0dc', 2.7, [0.5, 1, 0.55]],
  fill: ['#83a8c2', 0.55, [-0.85, 0.35, 0.1]],
  env: 0.36,
  exposure: 1.12,
  shadow: 12,
});

export const moduleDef: SceneDef = {
  id: 'module',
  pose(ctx, out) {
    samplePath(KEYS, scroll.p.why, out);
    out.shiftX = ctx.compact ? 0 : 0.17;
    out.shiftY = ctx.compact ? 0.15 : 0;
    out.sway = 0.14;
    out.fit = 0.85;
  },
  look(_ctx, out) {
    const p = scroll.p.why;
    const stack = ramp(whyLocal(p, 4), 0, 1) * (1 - ramp(whyLocal(p, 5), 0, 0.3));
    STUDIO.shadow = lerp(12, 22, clamp(stack * 2));
    STUDIO.fogFar = lerp(78, 120, clamp(stack * 2));
    STUDIO.focus.set(0, 0, 0);
    copyLook(out, STUDIO);
  },
};
