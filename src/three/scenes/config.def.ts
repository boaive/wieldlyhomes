import { CELL, MODULE_H, cellsOf, GRID_D, GRID_W } from '../../lib/grid';
import { clamp, lerp, smooth } from '../../lib/math';
import { liftPose } from '../../lib/shipping';
import { DOCK, configView, flights, shippedModules, useConfig, type Pose3 } from '../../state/config';
import { scroll } from '../../state/stage';
import { JOURNEY } from '../core/director';
import { copyLook, lookFrom, type SceneDef } from '../core/types';

const _pose: Pose3 = { x: 0, y: 0, z: 0, ry: 0 };

/** Centre and radius of everything the camera must keep in frame. */
export function frameBounds(includeFlights: boolean) {
  const { modules } = useConfig.getState();
  const list = scroll.chapter === 'journey' ? shippedModules(modules) : modules;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let top = MODULE_H;
  for (const m of list) {
    for (const [x, z] of cellsOf(m)) {
      const wx = (x - GRID_W / 2) * CELL;
      const wz = (z - GRID_D / 2) * CELL;
      minX = Math.min(minX, wx);
      maxX = Math.max(maxX, wx + CELL);
      minZ = Math.min(minZ, wz);
      maxZ = Math.max(maxZ, wz + CELL);
    }
    top = Math.max(top, (m.level + 1) * MODULE_H);
  }
  if (!list.length) {
    minX = -3;
    maxX = 3;
    minZ = -1.5;
    maxZ = 1.5;
  }
  if (scroll.chapter !== 'journey') {
    // The dock stays in frame so every pick is seen from start to finish.
    minX = Math.min(minX, DOCK.base.x - 1.6);
    minZ = Math.min(minZ, DOCK.base.z - 1.5);
    maxZ = Math.max(maxZ, DOCK.extended.z + 3);
  }
  if (includeFlights) {
    // Keep a module on the hoist in view, loosely, so the camera follows the lift.
    for (const f of flights.values()) {
      liftPose(f.t, f.from, f.to, f.clearance, _pose);
      const pull = 0.55;
      minX = Math.min(minX, lerp(minX, _pose.x - 3, pull));
      maxX = Math.max(maxX, lerp(maxX, _pose.x + 3, pull));
      minZ = Math.min(minZ, lerp(minZ, _pose.z - 3, pull));
      maxZ = Math.max(maxZ, lerp(maxZ, _pose.z + 3, pull));
    }
  }
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const radius = Math.hypot(maxX - minX, maxZ - minZ, top) / 2;
  return { cx, cz, top, radius };
}

const STUDIO = lookFrom({
  bg: '#0b1720',
  fog: [34, 130],
  hemi: ['#93abbb', '#0e171c', 0.52],
  key: ['#fff0dc', 2.7, [0.5, 1, 0.55]],
  fill: ['#83a8c2', 0.55, [-0.85, 0.35, 0.1]],
  env: 0.36,
  exposure: 1.12,
  shadow: 20,
});

/** 0→1 as the journey chapter takes over the configurator yard. */
export const yardMix = () => (scroll.chapter === 'journey' ? smooth(scroll.p.journey, 0.0, 0.05) : 0);

export const configDef: SceneDef = {
  id: 'config',
  pose(ctx, out) {
    const { cx, cz, top, radius } = frameBounds(true);
    const yard = yardMix();
    const r = Math.max(6.2, radius + 1.4);
    const yaw = lerp(configView.yaw, 0.5, yard);
    const pitch = lerp(0.56, 0.36, yard);
    const dist = lerp(r * 4.3, Math.max(46, r * 4.6), yard);
    const tx = lerp(cx, cx * 0.4 + 1, yard);
    const tz = lerp(cz, 5.5, yard);
    const ty = lerp(Math.min(top * 0.42, 5), 2.2, yard);
    out.look.set(tx, ty, tz);
    out.pos.set(tx + Math.sin(yaw) * Math.cos(pitch) * dist, ty + Math.sin(pitch) * dist, tz + Math.cos(yaw) * Math.cos(pitch) * dist);
    out.fov = 30;
    out.shiftX = ctx.compact ? 0 : lerp(-0.2, 0.12, yard);
    out.shiftY = ctx.compact ? lerp(0.15, 0.14, yard) : lerp(-0.07, 0, yard);
    out.sway = lerp(0, 0.2, yard);
    out.fit = lerp(0.62, 0.7, yard);
  },
  look(_ctx, out) {
    const { cx, cz, radius } = frameBounds(false);
    const yard = yardMix();
    STUDIO.focus.set(lerp(cx, 0, yard), 0, lerp(cz, 5, yard));
    STUDIO.shadow = lerp(Math.max(14, radius + 8), 30, yard);
    copyLook(out, STUDIO);
  },
  veil(ctx) {
    if (ctx.chapter !== 'journey') return 0;
    return clamp(1 - (JOURNEY.roadAt - scroll.p.journey) / 0.024);
  },
};
