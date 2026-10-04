import { PRECAST } from '../../content/timeline';
import { usePlans } from '../../state/plans';
import { scroll } from '../../state/stage';
import { copyLook, lookFrom, samplePath, type CamKey, type SceneDef } from '../core/types';

const span = (PRECAST.end - PRECAST.start) / PRECAST.count;
const at = (i: number, u = 0.5) => PRECAST.start + (i + u) * span;

/** Local 0→1 progress of precast beat `i` (base, extended, combined). */
export const precastLocal = (p: number, i: number) => (p - PRECAST.start - i * span) / span;

/** Where the two capsules stand when they are introduced. */
export const PAIR = { baseX: -5.6, extendedX: 2.4, y: 0.35 };

const KEYS: CamKey[] = [
  { at: 0, pos: [8, 8.4, 35], look: [-1.6, 1.2, 0] },
  { at: PRECAST.title[1], pos: [7, 7.6, 32], look: [-1.6, 1.2, 0] },
  { at: at(0), pos: [0.5, 3.4, 10.5], look: [PAIR.baseX, 1.7, 0] },
  { at: at(1), pos: [11, 3.6, 11.5], look: [PAIR.extendedX, 1.7, 0] },
  { at: at(2, 0.55), pos: [13, 7, 16], look: [2.6, 1.5, 0.6] },
  { at: 1, pos: [12, 6.6, 15], look: [2.6, 1.5, 0.6] },
];

const STUDIO = lookFrom({
  bg: '#0b1720',
  fog: [24, 84],
  hemi: ['#93abbb', '#0e171c', 0.5],
  key: ['#fff0dc', 2.7, [0.5, 1, 0.55]],
  fill: ['#83a8c2', 0.55, [-0.85, 0.35, 0.1]],
  env: 0.36,
  exposure: 1.12,
  shadow: 15,
});

export const systemDef: SceneDef = {
  id: 'system',
  pose(ctx, out) {
    if (ctx.chapter === 'plans') {
      // Aerial three-quarter view so the arrangement reads like its plan.
      // Larger arrangements are framed from further back.
      const reach = { 200: 1, 300: 1.14, 400: 1.14, 600: 1.42 }[usePlans.getState().area];
      out.pos.set(17.5 * reach, 18.5 * reach, 22 * reach);
      out.look.set(0, 1.0, 0.4);
      out.fov = 30;
      out.shiftX = ctx.compact ? 0 : ctx.mid ? -0.25 : -0.06;
      out.shiftY = ctx.compact ? 0.2 : 0;
      out.sway = 0.12;
      out.fit = ctx.compact ? 0.75 : 0;
      return;
    }
    samplePath(KEYS, scroll.p.precast, out);
    out.shiftX = ctx.compact ? 0 : 0.2;
    out.shiftY = ctx.compact ? 0.18 : 0.02;
    out.sway = 0.14;
    out.fit = 0.85;
  },
  look(_ctx, out) {
    copyLook(out, STUDIO);
  },
};
