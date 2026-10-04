/**
 * Configurator geometry rules.
 *
 * The product model is WHOLE MODULE → PICK → PLACE → COMBINE. Modules occupy
 * cells on a 3 m grid and can only be placed at predefined connection points:
 * edge-to-edge with an existing module on the same level, or fully supported
 * on top of the level below (up to 5 storeys, per the catalogue).
 */

export type ModuleType = 'base' | 'extended';
export type Rot = 0 | 1 | 2 | 3;

export interface PlacedModule {
  id: string;
  type: ModuleType;
  /** Anchor cell: minimum x / z cell of the footprint. */
  x: number;
  z: number;
  /** Quarter turns about the vertical axis. The glazed front follows the rotation. */
  rot: Rot;
  level: number;
}

export interface Slot {
  key: string;
  x: number;
  z: number;
  rot: Rot;
  level: number;
  type: ModuleType;
}

export const CELL = 3;
export const MODULE_H = 3;
export const GRID_W = 6;
export const GRID_D = 4;
export const MAX_LEVELS = 5;
export const MAX_MODULES = 12;

export const AREA_SQFT: Record<ModuleType, number> = { base: 100, extended: 200 };

const DIR_X: [number, number][] = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
];
const DIR_Z: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

const key = (x: number, z: number, level: number) => `${x},${z},${level}`;

/** Footprint in cells: [along x, along z]. */
export function footprint(type: ModuleType, rot: Rot): [number, number] {
  if (type === 'base') return [1, 1];
  return rot % 2 === 0 ? [2, 1] : [1, 2];
}

export function cellsOf(m: Pick<PlacedModule, 'type' | 'x' | 'z' | 'rot'>): [number, number][] {
  const [w, d] = footprint(m.type, m.rot);
  const cells: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) cells.push([m.x + i, m.z + j]);
  return cells;
}

/** World cell of bay `i` along the module's local long axis. */
function bayCell(m: Pick<PlacedModule, 'type' | 'x' | 'z' | 'rot'>, i: number): [number, number] {
  if (m.type === 'base') return [m.x, m.z];
  switch (m.rot) {
    case 0:
      return [m.x + i, m.z];
    case 1:
      return [m.x, m.z + (1 - i)];
    case 2:
      return [m.x + (1 - i), m.z];
    default:
      return [m.x, m.z + i];
  }
}

/** Centre of the footprint in world metres (y is the module base). */
export function worldCenter(m: Pick<PlacedModule, 'type' | 'x' | 'z' | 'rot' | 'level'>): [number, number, number] {
  const [w, d] = footprint(m.type, m.rot);
  return [(m.x + w / 2 - GRID_W / 2) * CELL, m.level * MODULE_H, (m.z + d / 2 - GRID_D / 2) * CELL];
}

export const rotationY = (rot: Rot) => (rot * Math.PI) / 2;

function occupancy(modules: PlacedModule[], ignoreId?: string) {
  const set = new Set<string>();
  for (const m of modules) {
    if (m.id === ignoreId) continue;
    for (const [x, z] of cellsOf(m)) set.add(key(x, z, m.level));
  }
  return set;
}

function fits(
  occ: Set<string>,
  hasAny: boolean,
  cand: Pick<PlacedModule, 'type' | 'x' | 'z' | 'rot' | 'level'>,
): boolean {
  const cells = cellsOf(cand);
  for (const [x, z] of cells) {
    if (x < 0 || z < 0 || x >= GRID_W || z >= GRID_D) return false;
    if (occ.has(key(x, z, cand.level))) return false;
  }
  if (cand.level > 0) {
    // Upper levels must rest fully on the level below.
    return cells.every(([x, z]) => occ.has(key(x, z, cand.level - 1)));
  }
  if (!hasAny) return true;
  // Ground level: share at least one edge with an existing ground module.
  return cells.some(([x, z]) =>
    DIR_X.some(([dx, dz]) => occ.has(key(x + dx, z + dz, 0))),
  );
}

export function canPlace(
  modules: PlacedModule[],
  cand: Pick<PlacedModule, 'type' | 'x' | 'z' | 'rot' | 'level'>,
  ignoreId?: string,
): boolean {
  const occ = occupancy(modules, ignoreId);
  const others = modules.filter((m) => m.id !== ignoreId);
  return fits(occ, others.some((m) => m.level === 0), cand);
}

/** Connection points available for a module of `type` / `rot` on `level`. */
export function validSlots(
  modules: PlacedModule[],
  type: ModuleType,
  rot: Rot,
  level: number,
  ignoreId?: string,
): Slot[] {
  const others = modules.filter((m) => m.id !== ignoreId);
  const occ = occupancy(others);
  const hasGround = others.some((m) => m.level === 0);
  const slots: Slot[] = [];

  if (!hasGround) {
    if (level !== 0) return slots;
    const [w, d] = footprint(type, rot);
    const x = Math.floor((GRID_W - w) / 2);
    const z = Math.floor((GRID_D - d) / 2);
    return [{ key: key(x, z, 0), x, z, rot, level: 0, type }];
  }

  for (let x = 0; x < GRID_W; x++) {
    for (let z = 0; z < GRID_D; z++) {
      const cand = { type, x, z, rot, level };
      if (fits(occ, true, cand)) slots.push({ key: key(x, z, level), ...cand });
    }
  }
  return slots;
}

/** The slot a one-tap "Add module" uses: closest to the existing mass, biased to the right. */
export function recommendedSlot(slots: Slot[], modules: PlacedModule[]): Slot | null {
  if (!slots.length) return null;
  if (!modules.length) return slots[0];
  let cx = 0;
  let cz = 0;
  for (const m of modules) {
    const [x, , z] = worldCenter(m);
    cx += x;
    cz += z;
  }
  cx /= modules.length;
  cz /= modules.length;
  let best = slots[0];
  let bestScore = Infinity;
  for (const s of slots) {
    const [x, , z] = worldCenter(s);
    const score = Math.hypot(x - cx, (z - cz) * 1.35) - x * 0.02;
    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

/** True when another module rests on `m` — it cannot be moved or removed first. */
export function isLoaded(modules: PlacedModule[], m: PlacedModule): boolean {
  const above = new Set<string>();
  for (const o of modules) {
    if (o.level !== m.level + 1) continue;
    for (const [x, z] of cellsOf(o)) above.add(`${x},${z}`);
  }
  return cellsOf(m).some(([x, z]) => above.has(`${x},${z}`));
}

/**
 * Exposure bit-mask: which faces of a module are open to the outside.
 * Faces that meet a neighbour are left open so combined modules read as one space.
 * Bits — front bay0, front bay1, back bay0, back bay1, left end, right end.
 */
export const FACE = { F0: 1, F1: 2, B0: 4, B1: 8, L: 16, R: 32 } as const;
export const ALL_EXPOSED = 63;

export function exposureMask(m: PlacedModule, modules: PlacedModule[]): number {
  const occ = new Set<string>();
  for (const o of modules) {
    if (o.level !== m.level || o.id === m.id) continue;
    for (const [x, z] of cellsOf(o)) occ.add(`${x},${z}`);
  }
  const free = (cell: [number, number], dir: [number, number]) =>
    !occ.has(`${cell[0] + dir[0]},${cell[1] + dir[1]}`);

  const dx = DIR_X[m.rot];
  const dz = DIR_Z[m.rot];
  const neg = (d: [number, number]): [number, number] => [-d[0], -d[1]];
  const bays = m.type === 'extended' ? 2 : 1;
  const first = bayCell(m, 0);
  const last = bayCell(m, bays - 1);

  let mask = 0;
  if (free(first, dz)) mask |= FACE.F0;
  if (free(first, neg(dz))) mask |= FACE.B0;
  if (bays === 2) {
    if (free(last, dz)) mask |= FACE.F1;
    if (free(last, neg(dz))) mask |= FACE.B1;
  }
  if (free(first, neg(dx))) mask |= FACE.L;
  if (free(last, dx)) mask |= FACE.R;
  return mask;
}

/** Unit cell-space vector of a module's glazed front. */
export const frontDirection = (rot: Rot): [number, number] => DIR_Z[rot];

export interface Totals {
  count: number;
  areaSqft: number;
  storeys: number;
  widthM: number;
  depthM: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null;
}

export function totals(modules: PlacedModule[]): Totals {
  if (!modules.length) return { count: 0, areaSqft: 0, storeys: 0, widthM: 0, depthM: 0, bounds: null };
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let top = 0;
  let area = 0;
  for (const m of modules) {
    area += AREA_SQFT[m.type];
    top = Math.max(top, m.level);
    for (const [x, z] of cellsOf(m)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + 1);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z + 1);
    }
  }
  return {
    count: modules.length,
    areaSqft: area,
    storeys: top + 1,
    widthM: (maxX - minX) * CELL,
    depthM: (maxZ - minZ) * CELL,
    bounds: { minX, maxX, minZ, maxZ },
  };
}

/** Shift a set of modules so their ground footprint sits centred on the grid. */
export function centred(modules: Omit<PlacedModule, 'id'>[]): PlacedModule[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const m of modules) {
    for (const [x, z] of cellsOf(m)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + 1);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z + 1);
    }
  }
  const ox = Math.floor((GRID_W - (maxX - minX)) / 2) - minX;
  const oz = Math.floor((GRID_D - (maxZ - minZ)) / 2) - minZ;
  return modules.map((m, i) => ({ ...m, id: `m${i + 1}`, x: m.x + ox, z: m.z + oz }));
}

export function describe(modules: PlacedModule[]): string {
  const t = totals(modules);
  if (!t.count) return 'No modules placed';
  const base = modules.filter((m) => m.type === 'base').length;
  const ext = t.count - base;
  const parts = [];
  if (ext) parts.push(`${ext} × extended capsule (6m × 3m)`);
  if (base) parts.push(`${base} × base capsule (3m × 3m)`);
  return `${parts.join(' + ')} · ${t.areaSqft} sq ft · ${t.storeys} ${t.storeys === 1 ? 'storey' : 'storeys'} · ${t.widthM}m × ${t.depthM}m footprint`;
}
