import { PIER_H } from '../../lib/dimensions';
import { CELL, GRID_D, GRID_W, MODULE_H, cellsOf, type PlacedModule } from '../../lib/grid';
import { Builder, type BuiltPart } from '../core/builder';

/**
 * Site-side elements generated from a module configuration: foundation, deck,
 * stairs, shades and roof. They follow whatever the visitor configured, so the
 * installed building is always their building.
 */

export { PIER_H };

const cx = (x: number) => (x - GRID_W / 2) * CELL;
const cz = (z: number) => (z - GRID_D / 2) * CELL;

function groundCells(modules: PlacedModule[]): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const m of modules) {
    if (m.level !== 0) continue;
    for (const [x, z] of cellsOf(m)) {
      const k = `${x},${z}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push([x, z]);
      }
    }
  }
  return out;
}

/** Footing pads, piers and plinth beams under every ground-level cell. */
export function foundationParts(modules: PlacedModule[]): BuiltPart[] {
  const b = new Builder();
  const cells = groundCells(modules);
  const points = new Set<string>();
  const edges = new Set<string>();
  for (const [x, z] of cells) {
    for (const [px, pz] of [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]) points.add(`${px},${pz}`);
    edges.add(`h:${x},${z}`).add(`h:${x},${z + 1}`).add(`v:${x},${z}`).add(`v:${x + 1},${z}`);
  }
  for (const key of points) {
    const [px, pz] = key.split(',').map(Number);
    b.box('concreteDark', 0.9, 0.18, 0.9, cx(px), 0.09, cz(pz));
    b.box('concrete', 0.38, PIER_H - 0.4, 0.38, cx(px), 0.18 + (PIER_H - 0.4) / 2, cz(pz));
  }
  for (const key of edges) {
    const [kind, rest] = key.split(':');
    const [x, z] = rest.split(',').map(Number);
    if (kind === 'h') b.box('concreteDark', CELL, 0.22, 0.28, cx(x) + CELL / 2, PIER_H - 0.11, cz(z));
    else b.box('concreteDark', 0.28, 0.22, CELL, cx(x), PIER_H - 0.11, cz(z) + CELL / 2);
  }
  return b.build();
}

/** Front-most ground cell of each occupied column — where the deck attaches. */
function frontCells(modules: PlacedModule[]): [number, number][] {
  const front = new Map<number, number>();
  for (const [x, z] of groundCells(modules)) front.set(x, Math.max(front.get(x) ?? -1, z));
  return [...front.entries()].sort((a, b) => a[0] - b[0]);
}

const DECK_D = 2.4;
const FLOOR = PIER_H + 0.2;

export function deckParts(modules: PlacedModule[]): BuiltPart[] {
  const b = new Builder();
  for (const [x, z] of frontCells(modules)) {
    const x0 = cx(x);
    const z0 = cz(z + 1);
    for (let i = 0; i < 15; i++) b.box('timber', CELL - 0.02, 0.035, 0.14, x0 + CELL / 2, FLOOR - 0.018, z0 + 0.08 + i * 0.16);
    b.box('steel', CELL, 0.14, 0.06, x0 + CELL / 2, FLOOR - 0.11, z0 + DECK_D - 0.03);
    b.box('steel', 0.06, 0.14, DECK_D, x0 + 0.03, FLOOR - 0.11, z0 + DECK_D / 2);
    b.box('steel', 0.06, 0.14, DECK_D, x0 + CELL - 0.03, FLOOR - 0.11, z0 + DECK_D / 2);
    for (const px of [x0 + 0.06, x0 + CELL - 0.06]) b.box('steel', 0.06, FLOOR - 0.18, 0.06, px, (FLOOR - 0.18) / 2, z0 + DECK_D - 0.06);
  }
  return b.build();
}

export function stairParts(modules: PlacedModule[]): BuiltPart[] {
  const b = new Builder();
  const front = frontCells(modules);
  if (!front.length) return [];
  const [x, z] = front[0];
  const xc = cx(x) + CELL / 2;
  const z0 = cz(z + 1) + DECK_D;
  const steps = 4;
  const rise = FLOOR / (steps + 1);
  for (let i = 0; i < steps; i++) {
    b.box('timber', 1.3, 0.045, 0.3, xc, FLOOR - rise * (i + 1), z0 + 0.16 + i * 0.3);
  }
  for (const sx of [-0.68, 0.68]) b.beam('steel', 0.06, xc + sx, FLOOR - 0.06, z0, xc + sx, 0.03, z0 + steps * 0.3 + 0.12);
  return b.build();
}

export function shadeParts(modules: PlacedModule[]): BuiltPart[] {
  const b = new Builder();
  const top = FLOOR + 2.62;
  for (const [x, z] of frontCells(modules)) {
    const x0 = cx(x);
    const z0 = cz(z + 1);
    for (const px of [x0 + 0.06, x0 + CELL - 0.06]) b.box('steel', 0.055, top - FLOOR, 0.055, px, (top + FLOOR) / 2, z0 + DECK_D - 0.06);
    b.box('steel', CELL, 0.1, 0.07, x0 + CELL / 2, top, z0 + DECK_D - 0.06);
    b.box('steel', 0.07, 0.1, DECK_D, x0 + 0.06, top, z0 + DECK_D / 2);
    b.box('steel', 0.07, 0.1, DECK_D, x0 + CELL - 0.06, top, z0 + DECK_D / 2);
    for (let i = 0; i < 11; i++) b.box('timber', CELL - 0.14, 0.03, 0.11, x0 + CELL / 2, top + 0.065, z0 + 0.2 + i * 0.205);
  }
  return b.build();
}

export function roofParts(modules: PlacedModule[]): BuiltPart[] {
  const b = new Builder();
  const top = new Map<string, number>();
  for (const m of modules) {
    for (const [x, z] of cellsOf(m)) {
      const k = `${x},${z}`;
      top.set(k, Math.max(top.get(k) ?? 0, m.level));
    }
  }
  for (const [k, level] of top) {
    const [x, z] = k.split(',').map(Number);
    const y = PIER_H + (level + 1) * MODULE_H;
    b.box('steelMid', CELL + 0.36, 0.05, CELL + 0.36, cx(x) + CELL / 2, y + 0.1, cz(z) + CELL / 2);
    b.box('steel', CELL, 0.075, CELL, cx(x) + CELL / 2, y + 0.04, cz(z) + CELL / 2);
  }
  return b.build();
}
