import { Builder, type BuiltPart } from '../core/builder';
import type { MatKey } from '../core/materials';
import { DEPTH, HEIGHT, widthOf } from '../../lib/dimensions';
import { ALL_EXPOSED, FACE, type ModuleType } from '../../lib/grid';

/**
 * Shared description of the capsule envelope.
 *
 * Both the simple configurator capsule and the layered hero module are built
 * from the same face layout, so every scene shows the same product.
 * Local frame: long axis along X, glazed front toward +Z, base at y = 0.
 */

export { DEPTH, HEIGHT, widthOf };

type Rect = [u0: number, u1: number, v0: number, v1: number];

interface FaceBay {
  u0: number;
  u1: number;
  hole: Rect | null;
  /** u-range of timber slat cladding on the solid part of the bay. */
  slats: [number, number] | null;
}

function frontBays(type: ModuleType): FaceBay[] {
  if (type === 'base') {
    return [{ u0: -1.5, u1: 1.5, hole: [-1.15, 0.45, 0.22, 2.55], slats: [0.72, 1.28] }];
  }
  return [
    { u0: -3, u1: 0, hole: [-2.65, -0.3, 0.22, 2.55], slats: null },
    { u0: 0, u1: 3, hole: [1.75, 2.6, 0.95, 2.3], slats: [0.3, 1.45] },
  ];
}

function backBays(type: ModuleType): FaceBay[] {
  const strip = (c: number): Rect => [c - 0.8, c + 0.8, 1.9, 2.35];
  if (type === 'base') return [{ u0: -1.5, u1: 1.5, hole: strip(0), slats: null }];
  return [
    { u0: -3, u1: 0, hole: strip(-1.5), slats: null },
    { u0: 0, u1: 3, hole: strip(1.5), slats: null },
  ];
}

const LEFT_END: FaceBay = { u0: -1.5, u1: 1.5, hole: [-0.3, 0.3, 0.5, 2.4], slats: null };
const RIGHT_END: FaceBay = { u0: -1.5, u1: 1.5, hole: null, slats: null };

/** Solid rectangles of a wall panel once its opening is taken out. */
function around(u0: number, u1: number, v0: number, v1: number, hole: Rect | null): Rect[] {
  if (!hole) return u1 - u0 > 0.01 ? [[u0, u1, v0, v1]] : [];
  const h0 = Math.max(u0, hole[0]);
  const h1 = Math.min(u1, hole[1]);
  if (h1 <= h0) return u1 - u0 > 0.01 ? [[u0, u1, v0, v1]] : [];
  const hv0 = Math.max(v0, hole[2]);
  const hv1 = Math.min(v1, hole[3]);
  const out: Rect[] = [];
  if (h0 - u0 > 0.01) out.push([u0, h0, v0, v1]);
  if (u1 - h1 > 0.01) out.push([h1, u1, v0, v1]);
  if (hv0 - v0 > 0.01) out.push([h0, h1, v0, hv0]);
  if (v1 - hv1 > 0.01) out.push([h0, h1, hv1, v1]);
  return out;
}

export interface ShellLayer {
  mat: MatKey;
  /** Distance from the outer face to this layer's outer surface. */
  inset: number;
  thick: number;
}

const frontBit = (i: number) => (i === 0 ? FACE.F0 : FACE.F1);
const backBit = (i: number) => (i === 0 ? FACE.B0 : FACE.B1);

/** Adds one envelope layer: floor and roof plates plus walls on every exposed face. */
export function addShell(b: Builder, type: ModuleType, mask: number, layer: ShellLayer): void {
  const W = widthOf(type);
  const { mat, inset, thick } = layer;
  const hw = W / 2;
  const hd = DEPTH / 2;

  b.box(mat, W - inset * 2, thick, DEPTH - inset * 2, 0, inset + thick / 2, 0);
  b.box(mat, W - inset * 2, thick, DEPTH - inset * 2, 0, HEIGHT - inset - thick / 2, 0);

  const v0 = inset + thick;
  const v1 = HEIGHT - inset - thick;
  const left = (mask & FACE.L) !== 0;
  const right = (mask & FACE.R) !== 0;
  const uMin = left ? -hw + inset + thick : -hw;
  const uMax = right ? hw - inset - thick : hw;

  frontBays(type).forEach((bay, i) => {
    if (!(mask & frontBit(i))) return;
    for (const [a, c, lo, hi] of around(Math.max(bay.u0, uMin), Math.min(bay.u1, uMax), v0, v1, bay.hole)) {
      b.box(mat, c - a, hi - lo, thick, (a + c) / 2, (lo + hi) / 2, hd - inset - thick / 2);
    }
  });
  backBays(type).forEach((bay, i) => {
    if (!(mask & backBit(i))) return;
    for (const [a, c, lo, hi] of around(Math.max(bay.u0, uMin), Math.min(bay.u1, uMax), v0, v1, bay.hole)) {
      b.box(mat, c - a, hi - lo, thick, (a + c) / 2, (lo + hi) / 2, -hd + inset + thick / 2);
    }
  });
  const ends: [boolean, FaceBay, number][] = [
    [left, LEFT_END, -hw + inset + thick / 2],
    [right, RIGHT_END, hw - inset - thick / 2],
  ];
  for (const [exposed, bay, x] of ends) {
    if (!exposed) continue;
    for (const [a, c, lo, hi] of around(-hd + inset, hd - inset, v0, v1, bay.hole)) {
      b.box(mat, thick, hi - lo, c - a, x, (lo + hi) / 2, (a + c) / 2);
    }
  }
}

/** Slim dark frames and glass in every opening of the exposed faces. */
export function addGlazing(b: Builder, type: ModuleType, mask: number, frame: MatKey = 'steel', glass: MatKey = 'glass'): void {
  const W = widthOf(type);
  const hw = W / 2;
  const hd = DEPTH / 2;
  const SET = 0.11;
  const F = 0.05;

  const pane = (hole: Rect, place: (u: number, v: number, du: number, dv: number, depth: number, mat: MatKey) => void) => {
    const [u0, u1, v0, v1] = hole;
    const du = u1 - u0;
    const dv = v1 - v0;
    const cu = (u0 + u1) / 2;
    const cv = (v0 + v1) / 2;
    place(cu, cv, du, dv, 0.018, glass);
    place(cu, v0 + F / 2, du, F, 0.07, frame);
    place(cu, v1 - F / 2, du, F, 0.07, frame);
    place(u0 + F / 2, cv, F, dv, 0.07, frame);
    place(u1 - F / 2, cv, F, dv, 0.07, frame);
    const mullions = du > 2 ? 2 : du > 1.2 ? 1 : 0;
    for (let i = 1; i <= mullions; i++) place(u0 + (du * i) / (mullions + 1), cv, F * 0.8, dv, 0.07, frame);
  };

  frontBays(type).forEach((bay, i) => {
    if (!(mask & frontBit(i)) || !bay.hole) return;
    pane(bay.hole, (u, v, du, dv, t, mat) => b.box(mat, du, dv, t, u, v, hd - SET));
  });
  backBays(type).forEach((bay, i) => {
    if (!(mask & backBit(i)) || !bay.hole) return;
    pane(bay.hole, (u, v, du, dv, t, mat) => b.box(mat, du, dv, t, u, v, -hd + SET));
  });
  if (mask & FACE.L && LEFT_END.hole) {
    pane(LEFT_END.hole, (u, v, du, dv, t, mat) => b.box(mat, t, dv, du, -hw + SET, v, u));
  }
}

/** Timber slat cladding on the solid part of exposed front bays. */
export function addCladding(b: Builder, type: ModuleType, mask: number, mat: MatKey = 'timber'): void {
  const hd = DEPTH / 2;
  frontBays(type).forEach((bay, i) => {
    if (!(mask & frontBit(i)) || !bay.slats) return;
    const [u0, u1] = bay.slats;
    const pitch = 0.105;
    const count = Math.floor((u1 - u0) / pitch);
    for (let k = 0; k <= count; k++) b.box(mat, 0.06, 2.5, 0.035, u0 + k * pitch, 1.5, hd + 0.016);
  });
}

/** Roof membrane and the four lifting anchors every capsule is picked up by. */
export function addRoofKit(b: Builder, type: ModuleType): void {
  const W = widthOf(type);
  b.box('steel', W - 0.36, 0.012, DEPTH - 0.36, 0, HEIGHT + 0.006, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) b.cyl('galv', 0.06, 0.07, sx * (W / 2 - 0.5), HEIGHT + 0.04, sz * 1.0, 0, 0, 0, 10);
  }
}

/** Positions of the lifting anchors on the roof (local frame). */
export const anchorPoints = (type: ModuleType): [number, number, number][] => {
  const W = widthOf(type);
  return [
    [-W / 2 + 0.5, HEIGHT + 0.07, -1.0],
    [W / 2 - 0.5, HEIGHT + 0.07, -1.0],
    [-W / 2 + 0.5, HEIGHT + 0.07, 1.0],
    [W / 2 - 0.5, HEIGHT + 0.07, 1.0],
  ];
};

const cache = new Map<string, BuiltPart[]>();

/**
 * The finished capsule as a single shell. Geometry is cached per
 * type + exposure, so any number of placed modules share a few buffers.
 */
export function capsuleParts(type: ModuleType, mask: number = ALL_EXPOSED): BuiltPart[] {
  const id = `${type}:${mask}`;
  const hit = cache.get(id);
  if (hit) return hit;

  const W = widthOf(type);
  const b = new Builder();
  addShell(b, type, mask, { mat: 'concrete', inset: 0, thick: 0.2 });
  addGlazing(b, type, mask);
  addCladding(b, type, mask);
  addRoofKit(b, type);

  // A warm, lined interior glimpsed through the glazing.
  b.box('timber', W - 0.44, 0.02, DEPTH - 0.44, 0, 0.21, 0);
  b.box('warmGlow', W - 1.4, 0.016, 0.1, 0, 2.785, -0.7);
  backBays(type).forEach((bay, i) => {
    if (mask & backBit(i)) b.box('interior', bay.u1 - bay.u0 - 0.2, 1.62, 0.02, (bay.u0 + bay.u1) / 2, 1.03, -DEPTH / 2 + 0.215);
  });
  if (mask & FACE.R) b.box('interior', 0.02, 2.56, DEPTH - 0.44, W / 2 - 0.215, 1.5, 0);

  const parts = b.build();
  cache.set(id, parts);
  return parts;
}
