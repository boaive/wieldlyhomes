import { lerp, smooth } from '../../lib/math';
import { scroll } from '../../state/stage';
import { copyLook, lookFrom, type SceneDef } from '../core/types';

const CONCEPT = lookFrom({
  bg: '#0b1720',
  fog: [26, 90],
  hemi: ['#a3b8c6', '#10191e', 0.6],
  key: ['#fff2e0', 2.4, [0.55, 1, 0.5]],
  fill: ['#86a9c0', 0.6, [-0.8, 0.4, 0.2]],
  env: 0.4,
  exposure: 1.1,
  shadow: 16,
});

/** Which concept is on stage: 0 = Labour Precamp, 1 = Capsule House. */
export const futureIndex = () => (scroll.chapter === 'precamp' ? 0 : 1);

export const futureDef: SceneDef = {
  id: 'future',
  pose(ctx, out) {
    const capsule = futureIndex() === 1;
    const p = capsule ? scroll.p.capsule : scroll.p.precamp;
    // A slow quarter-orbit while the chapter scrolls.
    const angle = lerp(0.95, 0.35, smooth(p, 0, 1));
    const radius = capsule ? 27 : 38;
    const height = capsule ? 5.2 : 8.5;
    out.look.set(0, capsule ? 1.9 : 3.0, 0);
    out.pos.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    out.fov = 30;
    out.shiftX = ctx.compact ? 0 : 0.2;
    out.shiftY = ctx.compact ? 0.19 : 0.03;
    out.sway = 0.16;
    out.fit = 0.9;
  },
  look(_ctx, out) {
    copyLook(out, CONCEPT);
  },
};
