import { HABITAT } from '../../content/timeline';
import { lerp, smooth } from '../../lib/math';
import { scroll } from '../../state/stage';
import { copyLook, lookFrom, samplePath, type CamKey, type SceneDef } from '../core/types';

const span = (HABITAT.end - HABITAT.start) / HABITAT.count;
const mid = (i: number) => HABITAT.start + (i + 0.5) * span;

/**
 * Interior walk: deck → living → kitchen → bedroom → bathroom → back out to the deck.
 * Every segment between two keys passes through a door opening, never a wall.
 */
const KEYS: CamKey[] = [
  { at: 0, pos: [1.7, 1.62, 8.6], look: [0.4, 1.25, 0], fov: 44 },
  { at: HABITAT.start, pos: [0.3, 1.56, 5.3], look: [0.9, 1.2, 0], fov: 48 },
  { at: mid(0), pos: [-1.9, 1.5, 2.25], look: [2.6, 1.0, 1.75], fov: 54 },
  { at: mid(1), pos: [-0.7, 1.5, 2.35], look: [2.0, 1.02, 0.35], fov: 52 },
  { at: mid(2), pos: [-0.1, 1.56, -0.12], look: [-2.2, 1.0, -2.7], fov: 62 },
  { at: mid(3), pos: [0.95, 1.5, -0.6], look: [2.3, 1.05, -2.5], fov: 56 },
  { at: mid(4), pos: [-1.8, 1.55, 1.4], look: [1.4, 1.1, 6.5], fov: 54 },
  { at: 1, pos: [-1.2, 1.55, 2.3], look: [1.7, 1.1, 7.6], fov: 52 },
];

const INTERIOR = lookFrom({
  bg: '#33495a',
  fog: [30, 220],
  hemi: ['#c3ced4', '#6b5a47', 0.62],
  key: ['#ffcb98', 3.0, [0.3, 0.42, 1]],
  fill: ['#86a6bd', 0.35, [-0.6, 0.5, -0.4]],
  env: 0.5,
  exposure: 1.04,
  shadow: 9,
});
INTERIOR.focus.set(0, 0, 1.4);
INTERIOR.lampA.pos.set(1.35, 2.0, 1.9);
INTERIOR.lampA.color.set('#ffd1a0');
INTERIOR.lampA.intensity = 15;
INTERIOR.lampA.distance = 9;
INTERIOR.lampB.color.set('#ffd6aa');
INTERIOR.lampB.intensity = 13;
INTERIOR.lampB.distance = 8;

export const habitatDef: SceneDef = {
  id: 'habitat',
  pose(ctx, out) {
    samplePath(KEYS, scroll.p.habitat, out, 52);
    if (ctx.compact) out.fov += 16;
    out.shiftX = ctx.compact ? 0 : 0.08;
    out.shiftY = ctx.compact ? 0.1 : 0;
    out.sway = 0.03;
    out.fit = 0;
  },
  look(_ctx, out) {
    // The second lamp follows the walk from bedroom to bathroom.
    const t = smooth(scroll.p.habitat, mid(2) + 0.04, mid(3) - 0.04);
    INTERIOR.lampB.pos.set(lerp(-1.6, 1.7, t), 2.05, lerp(-1.3, -1.6, t));
    // The tiled bathroom needs far less light than the bedroom.
    INTERIOR.lampB.intensity = lerp(13, 4.5, t);
    copyLook(out, INTERIOR);
  },
};
