import { clamp, lerp, ramp, smooth } from '../../lib/math';
import { roadW } from '../../lib/shipping';
import { scroll } from '../../state/stage';
import { JOURNEY } from '../core/director';
import { lookFrom, mixLook, type SceneDef } from '../core/types';
import { frameBounds } from './config.def';

/** Road: the lead truck travels from -ROAD.run to +ROAD.run along x. */
export const ROAD = { run: 70, spacing: 24 };
export const leadX = (p: number) => lerp(-ROAD.run, ROAD.run, roadW(p));

/** 0→1 across the site phase. */
export const siteV = (p: number) => ramp(p, JOURNEY.siteAt, 1);

export const onRoad = (p: number) => p < JOURNEY.siteAt;

const DUSK = {
  bg: '#33495a',
  hemi: ['#8fa9bb', '#1d2420', 0.62] as [string, string, number],
  key: ['#ffc592', 2.5, [-0.72, 0.36, 0.62]] as [string, number, [number, number, number]],
  fill: ['#7ea2bd', 0.6, [0.7, 0.5, -0.3]] as [string, number, [number, number, number]],
};

const ROAD_LOOK = lookFrom({ ...DUSK, fog: [40, 230], env: 0.34, exposure: 1.1, shadow: 30 });
const SITE_LOOK = lookFrom({ ...DUSK, fog: [46, 250], env: 0.34, exposure: 1.1, shadow: 26 });
const SITE_END = lookFrom({ ...DUSK, fog: [40, 220], env: 0.36, exposure: 1.14, shadow: 18 });
SITE_END.lampA.color.set('#ffcf96');
SITE_END.lampA.intensity = 16;
SITE_END.lampA.distance = 14;

export const routeDef: SceneDef = {
  id: 'route',

  pose(ctx, out) {
    const p = scroll.p.journey;
    out.fov = 32;
    out.shiftX = ctx.compact ? 0 : 0.13;
    out.shiftY = ctx.compact ? 0.14 : 0;
    out.fit = 0.7;

    if (onRoad(p)) {
      // Tracking shot: starts ahead of the convoy, ends alongside the trailer.
      const w = roadW(p);
      const x = leadX(p);
      out.pos.set(x + lerp(26, 6, w), lerp(2.3, 3.6, w), lerp(13, 19, w));
      out.look.set(x - lerp(2, 5, w), 2.3, 0);
      out.sway = 0.25;
      return;
    }

    const v = siteV(p);
    const { cx, cz, top, radius } = frameBounds(false);
    const r = Math.max(8, radius + 3);
    const settle = smooth(v, 0.66, 1);
    const yaw = lerp(0.72, 0.5, smooth(v, 0, 1));
    const pitch = lerp(0.38, 0.13, settle);
    const dist = lerp(r * 5.6, r * 2.35, settle);
    const tx = lerp(cx - 2, cx, settle);
    const tz = lerp(cz + 5, cz + 1.6, settle);
    const ty = lerp(3, Math.min(top * 0.5 + 0.9, 6), settle);
    out.look.set(tx, ty, tz);
    out.pos.set(tx + Math.sin(yaw) * Math.cos(pitch) * dist, ty + Math.sin(pitch) * dist + 0.4, tz + Math.cos(yaw) * Math.cos(pitch) * dist);
    out.sway = 0.2;
  },

  look(_ctx, out) {
    const p = scroll.p.journey;
    if (onRoad(p)) {
      ROAD_LOOK.focus.set(leadX(p) - 8, 0, 0);
      mixLook(out, ROAD_LOOK, ROAD_LOOK, 0);
      return;
    }
    const { cx, cz, top } = frameBounds(false);
    const v = siteV(p);
    SITE_LOOK.focus.set(cx - 2, 0, cz + 5);
    SITE_END.focus.set(cx, 0, cz + 2);
    SITE_END.lampA.pos.set(cx, top * 0.5 + 1.4, cz + 0.4);
    mixLook(out, SITE_LOOK, SITE_END, smooth(v, 0.7, 0.98));
  },

  veil() {
    const p = scroll.p.journey;
    const road = clamp(1 - (p - JOURNEY.roadAt) / 0.024);
    const site = clamp(1 - Math.abs(p - JOURNEY.siteAt) / 0.022);
    return Math.max(road, site);
  },
};
