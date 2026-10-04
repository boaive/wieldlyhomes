import { JOURNEY } from '../three/core/director';
import { PIER_H, TRAILER } from './dimensions';
import type { Pose3 } from '../state/config';
import { type PlacedModule, rotationY, worldCenter } from './grid';
import { clamp, lerp, ramp, smooth } from './math';

/**
 * Pick-and-place choreography.
 *
 * Everything here is a pure function of progress, so the same code drives the
 * time-based lifts in the configurator and the scroll-scrubbed lifts in the
 * journey chapter.
 */

const shortest = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Pose of a module being lifted from `from` to `to`: up, across, down. */
export function liftPose(t: number, from: Pose3, to: Pose3, clearance: number, out: Pose3): Pose3 {
  const top = Math.max(from.y, to.y) + clearance;
  const across = smooth(t, 0.2, 0.8);
  out.y = t < 0.5 ? lerp(from.y, top, smooth(t, 0, 0.34)) : lerp(top, to.y, smooth(t, 0.66, 1));
  out.x = lerp(from.x, to.x, across);
  out.z = lerp(from.z, to.z, across);
  out.ry = from.ry + shortest(to.ry - from.ry) * across;
  return out;
}

export const moduleLength = (m: PlacedModule) => (m.type === 'extended' ? 6 : 3);

export interface Shipment {
  /** Modules in the order they leave the yard (top levels first). */
  order: PlacedModule[];
  /** Truck index for each module in `order`. */
  truck: number[];
  /** Position of each module along its trailer (truck-local x). */
  slotX: number[];
  /** Index of each module within its truck, and that truck's module count. */
  seat: number[];
  load: number[];
  trucks: number;
}

/** Packs a configuration onto as many 12 m trailers as it needs. */
export function planShipment(modules: PlacedModule[]): Shipment {
  const order = [...modules].sort((a, b) => b.level - a.level || b.z - a.z || a.x - b.x);
  const truck: number[] = [];
  const slotX: number[] = [];
  const seat: number[] = [];
  const counts: number[] = [];
  let current = 0;
  let used = 0;
  for (const m of order) {
    const len = moduleLength(m);
    if (used > 0 && used + len > TRAILER.length) {
      current++;
      used = 0;
    }
    truck.push(current);
    seat.push(counts[current] ?? 0);
    counts[current] = (counts[current] ?? 0) + 1;
    slotX.push(TRAILER.backX + used + len / 2 + 0.1);
    used += len + 0.15;
  }
  return { order, truck, slotX, seat, load: order.map((_, i) => counts[truck[i]]), trucks: current + 1 };
}

/** Where the trailer parks beside the pad — the same in the yard and on site. */
export const BAY = { x: 3.2, z: 13 } as const;

export interface TruckPose {
  x: number;
  z: number;
  visible: boolean;
}

/** Yard: each truck arrives, is loaded, and leaves. `u` is 0→1 across the yard phase. */
const YARD = { from: 0.05, to: 0.97, arrive: 0.2, depart: 0.82 } as const;
/** Site: `v` is 0→1 across the site phase. */
export const SITE = {
  from: 0.05,
  to: 0.68,
  arrive: 0.2,
  depart: 0.86,
  deck: [0.7, 0.77],
  stairs: [0.76, 0.83],
  shades: [0.82, 0.89],
  roof: [0.88, 0.95],
} as const;

const yardU = (p: number) => ramp(p, 0, JOURNEY.roadAt);
const siteV = (p: number) => ramp(p, JOURNEY.siteAt, 1);
export const roadW = (p: number) => ramp(p, JOURNEY.roadAt, JOURNEY.siteAt);

/** Local 0→1 progress of truck `k`'s turn at the bay. */
const turn = (x: number, k: number, trucks: number, from: number, to: number) => {
  const span = (to - from) / trucks;
  return (x - (from + k * span)) / span;
};

export function yardTruck(k: number, p: number, s: Shipment, out: TruckPose): TruckPose {
  const t = turn(yardU(p), k, s.trucks, YARD.from, YARD.to);
  out.z = BAY.z;
  out.visible = t > -0.02 && t < 1.25;
  if (t < YARD.arrive) out.x = BAY.x - 75 * Math.pow(1 - clamp(t / YARD.arrive), 2);
  else if (t < YARD.depart) out.x = BAY.x;
  else out.x = BAY.x + 95 * Math.pow((t - YARD.depart) / (1 - YARD.depart), 2);
  return out;
}

/** On site the trucks are handled in reverse, so ground-level modules arrive first. */
const siteTurn = (k: number, s: Shipment) => s.trucks - 1 - k;

export function siteTruck(k: number, p: number, s: Shipment, out: TruckPose): TruckPose {
  const t = turn(siteV(p), siteTurn(k, s), s.trucks, SITE.from, SITE.to);
  out.z = BAY.z;
  out.visible = t > -0.6 && t < 1.3;
  if (t < SITE.arrive) out.x = BAY.x - 70 * Math.pow(1 - clamp((t + 0.5) / (SITE.arrive + 0.5)), 2);
  else if (t < SITE.depart) out.x = BAY.x;
  else out.x = BAY.x + 95 * Math.pow((t - SITE.depart) / (1 - SITE.depart), 2);
  return out;
}

const _truck: TruckPose = { x: 0, z: 0, visible: true };
const _a: Pose3 = { x: 0, y: 0, z: 0, ry: 0 };
const _b: Pose3 = { x: 0, y: 0, z: 0, ry: 0 };

export interface ShipPose extends Pose3 {
  /** 0→1 while on the hook, otherwise -1. */
  lift: number;
}

/** Pose of module `i` during the yard phase (pad frame). */
export function yardModule(i: number, p: number, s: Shipment, out: ShipPose): ShipPose {
  const m = s.order[i];
  const k = s.truck[i];
  const t = turn(yardU(p), k, s.trucks, YARD.from, YARD.to);
  const span = (YARD.depart - 0.02 - YARD.arrive) / s.load[i];
  const local = (t - YARD.arrive - s.seat[i] * span) / span;
  const [x, y, z] = worldCenter(m);
  _a.x = x;
  _a.y = y;
  _a.z = z;
  _a.ry = rotationY(m.rot);
  yardTruck(k, p, s, _truck);
  _b.x = _truck.x + s.slotX[i];
  _b.y = TRAILER.deckY;
  _b.z = _truck.z;
  _b.ry = 0;
  if (local <= 0) Object.assign(out, _a, { lift: -1 });
  else if (local >= 1) Object.assign(out, _b, { lift: -1 });
  else {
    liftPose(local, _a, _b, 4.6, out);
    out.lift = local;
  }
  return out;
}

/** Pose of module `i` during the site phase (pad frame, modules resting on their piers). */
export function siteModule(i: number, p: number, s: Shipment, out: ShipPose): ShipPose {
  const m = s.order[i];
  const k = s.truck[i];
  const t = turn(siteV(p), siteTurn(k, s), s.trucks, SITE.from, SITE.to);
  const span = (SITE.depart - 0.02 - SITE.arrive) / s.load[i];
  // Unload in reverse of the loading order within each truck.
  const local = (t - SITE.arrive - (s.load[i] - 1 - s.seat[i]) * span) / span;
  siteTruck(k, p, s, _truck);
  _a.x = _truck.x + s.slotX[i];
  _a.y = TRAILER.deckY;
  _a.z = _truck.z;
  _a.ry = 0;
  const [x, y, z] = worldCenter(m);
  _b.x = x;
  _b.y = y + PIER_H;
  _b.z = z;
  _b.ry = rotationY(m.rot);
  if (local <= 0) Object.assign(out, _a, { lift: -1 });
  else if (local >= 1) Object.assign(out, _b, { lift: -1 });
  else {
    liftPose(local, _a, _b, 4.6, out);
    out.lift = local;
  }
  return out;
}
