import { STORY } from '../../content/timeline';
import { lerp, ramp, smooth } from '../../lib/math';
import { scroll } from '../../state/stage';
import { lookFrom, mixLook, samplePath, type CamKey, type SceneDef } from '../core/types';
import { PIER_H } from '../objects/siteKit';

/** The module is manufactured on the factory bed, then installed on the site foundation. */
export const STORY_LAYOUT = {
  bedX: -20,
  bedTop: 0.55,
  siteY: PIER_H,
};

const span = (STORY.end - STORY.start) / STORY.count;
const at = (i: number, u = 0.5) => STORY.start + (i + u) * span;

/** Local 0→1 progress of construction stage `i`. */
export const storyLocal = (p: number, i: number) => (p - STORY.start - i * span) / span;

/** 0→1 travel of the module from factory bed to site during stage 08. */
export const installFlight = (p: number) => ramp(storyLocal(p, 7), 0.06, 0.6);

const B = STORY_LAYOUT.bedX;

const KEYS: CamKey[] = [
  { at: 0, pos: [12.5, 6.2, 15.5], look: [0, 0.5, 0.5] },
  { at: at(0), pos: [9.5, 4.6, 12.5], look: [0, 0.5, 0.5] },
  { at: at(1, 0.45), pos: [B + 10.5, 3.9, 13], look: [B, 2.1, 0] },
  { at: at(2), pos: [B + 9.5, 3.4, 11.6], look: [B, 2.1, 0] },
  { at: at(3), pos: [B + 8.4, 3.1, 10.4], look: [B + 0.5, 2.0, 0] },
  { at: at(4), pos: [B + 11, 4.3, 14], look: [B, 2.0, 0] },
  { at: at(5), pos: [B + 13, 6.2, 17.5], look: [B - 1.5, 2.8, -0.5] },
  { at: at(6), pos: [B + 8, 2.9, 9.8], look: [B - 0.3, 1.95, 0] },
  { at: at(7, 0.12), pos: [B + 12, 5.2, 20], look: [B, 3.2, 0] },
  { at: at(7, 0.42), pos: [-2, 5.6, 24], look: [-9, 4.8, 0], ease: 'linear' },
  { at: at(7, 0.74), pos: [10.5, 4.2, 14.5], look: [0, 2.3, 0.9] },
  { at: at(8), pos: [8.8, 2.6, 12.4], look: [0, 2.3, 1.1] },
  { at: 1, pos: [8, 2.5, 11.6], look: [0, 2.3, 1.1] },
];

const WORK = lookFrom({
  bg: '#0b1720',
  fog: [24, 86],
  hemi: ['#98b0bf', '#0e171c', 0.52],
  key: ['#fff0dc', 2.7, [0.45, 1, 0.6]],
  fill: ['#83a8c2', 0.55, [-0.85, 0.35, 0.1]],
  env: 0.36,
  exposure: 1.12,
  shadow: 14,
});

const HABITAT = lookFrom({
  bg: '#0c1922',
  fog: [24, 86],
  hemi: ['#8ea6b8', '#151b1c', 0.46],
  key: ['#ffcf9c', 2.3, [0.75, 0.42, 0.7]],
  fill: ['#7fa4c0', 0.6, [-0.8, 0.4, -0.2]],
  env: 0.34,
  exposure: 1.14,
  shadow: 14,
});
HABITAT.lampA.pos.set(-0.8, PIER_H + 2.2, 0.2);
HABITAT.lampA.color.set('#ffcf96');
HABITAT.lampA.intensity = 15;
HABITAT.lampA.distance = 11;
HABITAT.lampB.pos.set(1.5, PIER_H + 2.4, 3);
HABITAT.lampB.color.set('#ffd9ae');
HABITAT.lampB.intensity = 7;
HABITAT.lampB.distance = 9;

export const storyDef: SceneDef = {
  id: 'story',
  pose(ctx, out) {
    samplePath(KEYS, scroll.p.story, out);
    out.shiftX = ctx.compact ? 0 : 0.16;
    out.shiftY = ctx.compact ? 0.16 : 0;
    out.sway = 0.12;
    out.fit = 0.8;
  },
  look(_ctx, out) {
    const p = scroll.p.story;
    const toBed = smooth(storyLocal(p, 1), -0.25, 0.3);
    const x = lerp(lerp(0, B, toBed), 0, installFlight(p));
    WORK.focus.set(x, 0, 0);
    HABITAT.focus.set(0, 0, 0.5);
    mixLook(out, WORK, HABITAT, smooth(storyLocal(p, 7), 0.6, 1.1));
  },
};
