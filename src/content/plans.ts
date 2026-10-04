import type { ModuleType, Rot } from '../lib/grid';

/**
 * Catalogue layouts — 200, 300, 400 and 600 sq ft.
 *
 * Geometry is redrawn from the floor plans in the Wieldy Homes Product
 * Catalogue 2026 (units: feet, origin top-left). Room names, option counts,
 * footprints and stated room dimensions are the catalogue's. The drawings are
 * indicative, as the catalogue states, and can be replaced by final CAD exports
 * via /public/assets/floorplans without touching the components.
 */

export type Seg = [x1: number, y1: number, x2: number, y2: number];

export interface Door {
  /** Hinge jamb. */
  at: [number, number];
  /** Opposite jamb. */
  to: [number, number];
  /** Side of the wall the leaf swings toward. Omit for a plain opening. */
  into?: [number, number];
}

export interface Zone {
  kind: 'deck' | 'garden' | 'court' | 'steps';
  rect: [x: number, y: number, w: number, h: number];
  label?: string;
}

export type FixtureKind = 'bed' | 'wc' | 'basin' | 'shower' | 'sofa' | 'counter' | 'table' | 'wardrobe' | 'desk';

export interface Fixture {
  kind: FixtureKind;
  rect: [x: number, y: number, w: number, h: number];
  /** Which side the headboard / back / tank sits on. */
  side?: 'n' | 's' | 'e' | 'w';
}

export interface PlanLabel {
  text: string;
  sub?: string;
  at: [number, number];
}

export interface PlanModule {
  type: ModuleType;
  x: number;
  z: number;
  rot: Rot;
  level: number;
}

export interface PlanDef {
  id: string;
  area: 200 | 300 | 400 | 600;
  option: number;
  footprint: string;
  rooms: string[];
  size: [w: number, h: number];
  /** Closed outline of the exterior wall. */
  outline: [number, number][];
  partitions: Seg[];
  doors: Door[];
  windows: Seg[];
  zones: Zone[];
  fixtures: Fixture[];
  labels: PlanLabel[];
}

export interface PlanGroup {
  area: 200 | 300 | 400 | 600;
  sqm: string;
  footprint: string;
  /** Catalogue caption for the matching elevation. */
  elevation: string;
  /** Indicative arrangement of capsules for the 3D view. */
  modules: PlanModule[];
  plans: PlanDef[];
}

const rect = (w: number, h: number): [number, number][] => [
  [0, 0],
  [w, 0],
  [w, h],
  [0, h],
];

const bath = (x: number, y: number): Fixture[] => [
  { kind: 'shower', rect: [x + 0.4, y + 0.4, 2.8, 3.4] },
  { kind: 'wc', rect: [x + 4.1, y + 0.45, 1.5, 2.3], side: 'n' },
  { kind: 'basin', rect: [x + 7, y + 0.45, 2.4, 1.5] },
];

const p200a: PlanDef = {
  id: '200-1',
  area: 200,
  option: 1,
  footprint: "10' × 20' footprint",
  rooms: ['Bed room', 'Toilet', 'Foyer'],
  size: [10, 20],
  outline: rect(10, 20),
  partitions: [
    [0, 4.5, 10, 4.5],
    [0, 15, 10, 15],
  ],
  doors: [
    { at: [9.5, 4.5], to: [7.1, 4.5], into: [0, -1] },
    { at: [9.5, 15], to: [6.4, 15] },
    { at: [9, 20], to: [6.2, 20], into: [0, -1] },
  ],
  windows: [
    [0, 8, 0, 12],
    [0, 1.2, 0, 3],
  ],
  zones: [
    { kind: 'deck', rect: [0, 20.25, 10, 2.8] },
    { kind: 'steps', rect: [-2.6, 20.25, 2.6, 2.8] },
  ],
  fixtures: [
    ...bath(0, 0),
    { kind: 'bed', rect: [0.6, 6.3, 5.8, 5.2], side: 'w' },
    { kind: 'wardrobe', rect: [0.5, 12.9, 5.6, 1.6] },
    { kind: 'sofa', rect: [0.6, 15.5, 5.2, 1.7], side: 'n' },
  ],
  labels: [
    { text: 'Toilet', sub: `4'0" × 9'0"`, at: [3.3, 3.5] },
    { text: 'Bed room', at: [7.2, 12.2] },
    { text: 'Foyer', at: [3.2, 18.6] },
  ],
};

const p200b: PlanDef = {
  id: '200-2',
  area: 200,
  option: 2,
  footprint: "10' × 20' footprint",
  rooms: ['Bed room', 'Toilet', 'Wash area'],
  size: [10, 20],
  outline: rect(10, 20),
  partitions: [[0, 5, 10, 5]],
  doors: [
    { at: [9.5, 5], to: [7.1, 5], into: [0, -1] },
    { at: [9, 20], to: [6.2, 20], into: [0, -1] },
  ],
  windows: [
    [0, 9, 0, 13],
    [0, 1.2, 0, 3],
  ],
  zones: [
    { kind: 'deck', rect: [0, 20.25, 10, 2.8] },
    { kind: 'steps', rect: [-2.6, 20.25, 2.6, 2.8] },
  ],
  fixtures: [
    ...bath(0, 0),
    { kind: 'counter', rect: [0.4, 5.4, 6, 1.5] },
    { kind: 'bed', rect: [0.6, 9.4, 6, 5.2], side: 'w' },
    { kind: 'wardrobe', rect: [0.5, 17.9, 2.6, 1.6] },
    { kind: 'desk', rect: [3.2, 17.9, 2.6, 1.6], side: 'n' },
  ],
  labels: [
    { text: 'Toilet', sub: `4'6" × 9'0"`, at: [3.3, 4] },
    { text: 'Wash area', at: [8, 7.6] },
    { text: 'Bed room', at: [7, 16.2] },
  ],
};

const p300a: PlanDef = {
  id: '300-1',
  area: 300,
  option: 1,
  footprint: "≈20' × 20' footprint",
  rooms: ['Bed room', 'Living', 'Toilet', 'Outdoor balcony / garden'],
  size: [20, 20],
  outline: [
    [0, 0],
    [10, 0],
    [10, 10],
    [20, 10],
    [20, 20],
    [0, 20],
  ],
  partitions: [
    [0, 5, 10, 5],
    [10, 10, 10, 20],
  ],
  doors: [
    { at: [9.5, 5], to: [7.1, 5], into: [0, -1] },
    { at: [10, 17.6], to: [10, 14.9], into: [-1, 0] },
    { at: [19, 20], to: [16.2, 20], into: [0, -1] },
    { at: [10.7, 10], to: [13.3, 10], into: [0, 1] },
  ],
  windows: [
    [0, 9, 0, 13],
    [20, 12.5, 20, 17],
    [0, 1.2, 0, 3],
  ],
  zones: [
    { kind: 'garden', rect: [10.25, 0.25, 9.5, 9.5], label: 'Outdoor balcony / garden' },
    { kind: 'deck', rect: [10, 20.25, 10, 2.6] },
    { kind: 'steps', rect: [7.4, 20.25, 2.6, 2.6] },
  ],
  fixtures: [
    ...bath(0, 0),
    { kind: 'counter', rect: [0.4, 5.4, 5, 1.4] },
    { kind: 'bed', rect: [0.6, 8.8, 6, 5.2], side: 'w' },
    { kind: 'wardrobe', rect: [2.8, 18, 6.6, 1.5] },
    { kind: 'sofa', rect: [10.8, 10.7, 5.4, 1.7], side: 'n' },
    { kind: 'table', rect: [14.4, 14, 2.2, 1.1] },
  ],
  labels: [
    { text: 'Toilet', sub: `4'6" × 9'0"`, at: [3.3, 4] },
    { text: 'Bed room', at: [5.4, 16] },
    { text: 'Living', at: [15, 17] },
  ],
};

const p300b: PlanDef = {
  id: '300-2',
  area: 300,
  option: 2,
  footprint: "≈20' × 20' footprint",
  rooms: ['Bed room', 'Living', 'Toilet', 'Outdoor balcony / garden'],
  size: [20, 20],
  outline: [
    [0, 0],
    [10, 0],
    [10, 8.5],
    [20, 8.5],
    [20, 18.5],
    [10, 18.5],
    [10, 20],
    [0, 20],
  ],
  partitions: [
    [0, 5, 10, 5],
    [10, 8.5, 10, 18.5],
  ],
  doors: [
    { at: [9.5, 5], to: [7.1, 5], into: [0, -1] },
    { at: [10, 16.6], to: [10, 13.9], into: [-1, 0] },
    { at: [17.6, 18.5], to: [14.8, 18.5], into: [0, -1] },
    { at: [10.7, 8.5], to: [13.3, 8.5], into: [0, 1] },
  ],
  windows: [
    [0, 9, 0, 13],
    [20, 11, 20, 15.5],
    [0, 1.2, 0, 3],
  ],
  zones: [
    { kind: 'garden', rect: [10.25, 0.25, 9.5, 8], label: 'Outdoor balcony / garden' },
    { kind: 'deck', rect: [10.25, 18.75, 7.2, 1.9] },
    { kind: 'steps', rect: [17.45, 18.75, 2.55, 1.9] },
  ],
  fixtures: [
    ...bath(0, 0),
    { kind: 'bed', rect: [0.6, 8.8, 6, 5.2], side: 'w' },
    { kind: 'wardrobe', rect: [2.8, 18, 6.6, 1.5] },
    { kind: 'sofa', rect: [10.8, 9.2, 5.2, 1.7], side: 'n' },
    { kind: 'table', rect: [14.4, 12.4, 2.2, 1.1] },
  ],
  labels: [
    { text: 'Toilet', at: [3.3, 4] },
    { text: 'Bed room', at: [5.4, 16] },
    { text: 'Living', at: [15, 16] },
  ],
};

const p300c: PlanDef = {
  id: '300-3',
  area: 300,
  option: 3,
  footprint: "20' × 20' footprint",
  rooms: ['Bed room', 'Living', 'Pantry kitchen', 'Toilet', 'Store'],
  size: [20, 20],
  outline: [
    [0, 0],
    [20, 0],
    [20, 10],
    [10, 10],
    [10, 20],
    [0, 20],
  ],
  partitions: [
    [0, 5, 10, 5],
    [10, 0, 10, 10],
    [0, 16.4, 4.6, 16.4],
    [4.6, 16.4, 4.6, 20],
  ],
  doors: [
    { at: [9.5, 5], to: [7.1, 5], into: [0, -1] },
    { at: [10, 9.5], to: [10, 6.9], into: [1, 0] },
    { at: [10, 17.4], to: [10, 14.6], into: [-1, 0] },
    { at: [4.6, 16.9], to: [4.6, 19.2], into: [1, 0] },
  ],
  windows: [
    [20, 3, 20, 7],
    [0, 9, 0, 13],
    [0, 1.2, 0, 3],
  ],
  zones: [
    { kind: 'deck', rect: [10.25, 10.25, 3.2, 7.8] },
    { kind: 'steps', rect: [10.25, 18.05, 3.2, 2.2] },
  ],
  fixtures: [
    ...bath(0, 0),
    { kind: 'counter', rect: [0.4, 5.4, 6.4, 1.5] },
    { kind: 'sofa', rect: [0.6, 9.2, 1.7, 5.4], side: 'w' },
    { kind: 'table', rect: [3.6, 10.8, 1.2, 2.2] },
    { kind: 'bed', rect: [13.4, 2.2, 6, 5.2], side: 'e' },
  ],
  labels: [
    { text: 'Toilet', at: [3.3, 4] },
    { text: 'Pantry kitchen', at: [5, 8.2] },
    { text: 'Living', at: [6.6, 13.6] },
    { text: 'Store', at: [2.3, 18.5] },
    { text: 'Bed room', at: [14.6, 8.8] },
  ],
};

const bathRight = (): Fixture[] => [
  { kind: 'basin', rect: [10.8, 0.45, 2.4, 1.5] },
  { kind: 'wc', rect: [13.9, 0.45, 1.5, 2.3], side: 'n' },
  { kind: 'shower', rect: [16.6, 0.4, 3, 3.4] },
];

const p400a: PlanDef = {
  id: '400-1',
  area: 400,
  option: 1,
  footprint: "20' × 20' footprint",
  rooms: ['Bed room', 'Office', 'Living', 'Toilet'],
  size: [20, 20],
  outline: rect(20, 20),
  partitions: [
    [10, 0, 10, 20],
    [0, 10.2, 10, 10.2],
    [10, 6.2, 20, 6.2],
  ],
  doors: [
    { at: [10, 9.7], to: [10, 7.2], into: [-1, 0] },
    { at: [10, 18.9], to: [10, 16.3], into: [-1, 0] },
    { at: [10.6, 6.2], to: [13.1, 6.2], into: [0, -1] },
    { at: [10.8, 20], to: [13.6, 20], into: [0, -1] },
  ],
  windows: [
    [0, 2, 0, 6],
    [0, 13, 0, 17],
    [20, 9.5, 20, 15.5],
    [20, 1.4, 20, 3.2],
  ],
  zones: [
    { kind: 'deck', rect: [6.4, 20.25, 8, 2.6] },
    { kind: 'steps', rect: [14.4, 20.25, 2.6, 2.6] },
  ],
  fixtures: [
    { kind: 'bed', rect: [0.6, 1.2, 6.2, 5], side: 'w' },
    { kind: 'wardrobe', rect: [0.5, 8.3, 5, 1.5] },
    { kind: 'desk', rect: [2, 13.4, 5, 1.6], side: 'n' },
    ...bathRight(),
    { kind: 'counter', rect: [13, 6.6, 6.5, 1.5] },
    { kind: 'sofa', rect: [17.7, 12.4, 1.7, 5.2], side: 'e' },
    { kind: 'table', rect: [14.4, 13.6, 1.2, 2.4] },
  ],
  labels: [
    { text: 'Bed room', at: [6.6, 7.4] },
    { text: 'Office', at: [6.4, 17] },
    { text: 'Toilet', at: [14.6, 4.8] },
    { text: 'Living', at: [13.6, 11.4] },
  ],
};

const p400b: PlanDef = {
  id: '400-2',
  area: 400,
  option: 2,
  footprint: "20' × 20' footprint",
  rooms: ['Bed room', 'Bed room', 'Wardrobe', 'Living', 'Toilet'],
  size: [20, 20],
  outline: rect(20, 20),
  partitions: [
    [10, 0, 10, 20],
    [0, 9.2, 10, 9.2],
    [0, 10.8, 10, 10.8],
    [10, 6.2, 20, 6.2],
  ],
  doors: [
    { at: [10, 8.7], to: [10, 6.3], into: [-1, 0] },
    { at: [10, 11.3], to: [10, 13.7], into: [-1, 0] },
    { at: [10.6, 6.2], to: [13.1, 6.2], into: [0, -1] },
    { at: [10.8, 20], to: [13.6, 20], into: [0, -1] },
  ],
  windows: [
    [0, 2, 0, 6],
    [0, 14, 0, 18],
    [20, 9.5, 20, 15.5],
    [20, 1.4, 20, 3.2],
  ],
  zones: [
    { kind: 'deck', rect: [12, 20.25, 8, 2.6] },
    { kind: 'steps', rect: [9.4, 20.25, 2.6, 2.6] },
  ],
  fixtures: [
    { kind: 'bed', rect: [0.6, 1.2, 6.2, 5], side: 'w' },
    { kind: 'bed', rect: [0.6, 13.8, 6.2, 5], side: 'w' },
    { kind: 'wardrobe', rect: [0.4, 9.5, 5.6, 1] },
    ...bathRight(),
    { kind: 'counter', rect: [13, 6.6, 6.5, 1.5] },
    { kind: 'sofa', rect: [17.7, 11, 1.7, 5.2], side: 'e' },
    { kind: 'table', rect: [14.4, 12.6, 1.2, 2.4] },
  ],
  labels: [
    { text: 'Bed room', at: [6.4, 7.6] },
    { text: 'Wardrobe', at: [8, 10.2] },
    { text: 'Bed room', at: [6.4, 12.4] },
    { text: 'Toilet', at: [14.6, 4.8] },
    { text: 'Living', at: [13.8, 17] },
  ],
};

const SHELL_600: [number, number][] = [
  [0, 2.8],
  [8.5, 2.8],
  [8.5, 0],
  [21.5, 0],
  [21.5, 2.8],
  [30, 2.8],
  [30, 20],
  [21.5, 20],
  [21.5, 8.5],
  [8.5, 8.5],
  [8.5, 20],
  [0, 20],
];

const ZONES_600: Zone[] = [
  { kind: 'deck', rect: [0, 0, 8.25, 2.55] },
  { kind: 'deck', rect: [21.75, 0, 8.25, 2.55] },
  { kind: 'court', rect: [8.75, 8.75, 12.5, 11.25], label: 'Open courtyard' },
];

const p600a: PlanDef = {
  id: '600-1',
  area: 600,
  option: 1,
  footprint: "L-shaped · ≈20' × 30' with central courtyard",
  rooms: ['Bedroom 1', 'Bedroom 2', 'Living', 'Pantry kitchen / TV unit', 'Open courtyard', 'Toilet × 2'],
  size: [30, 20],
  outline: SHELL_600,
  partitions: [
    [6.2, 2.8, 6.2, 9.4],
    [0, 9.4, 8.5, 9.4],
    [21.5, 13.4, 30, 13.4],
    [24.4, 13.4, 24.4, 20],
  ],
  doors: [
    { at: [6.2, 3.3], to: [6.2, 5.7], into: [-1, 0] },
    { at: [6.4, 9.4], to: [8.4, 9.4], into: [0, 1] },
    { at: [8.5, 2.7], to: [8.5, 0.4], into: [1, 0] },
    { at: [21.5, 6.2], to: [21.5, 3], },
    { at: [26.6, 2.8], to: [29, 2.8], into: [0, 1] },
    { at: [24.4, 14], to: [24.4, 16.3], into: [1, 0] },
  ],
  windows: [
    [0, 13, 0, 17.5],
    [30, 6, 30, 10.5],
    [11, 0, 16, 0],
  ],
  zones: ZONES_600,
  fixtures: [
    { kind: 'basin', rect: [0.5, 3.3, 1.5, 1.5] },
    { kind: 'wc', rect: [0.5, 5.4, 2.2, 1.4], side: 'w' },
    { kind: 'shower', rect: [0.4, 7.1, 2.2, 2] },
    { kind: 'bed', rect: [0.6, 13.6, 6, 5.2], side: 'w' },
    { kind: 'sofa', rect: [16.6, 0.5, 4.4, 1.6], side: 'n' },
    { kind: 'table', rect: [17.6, 3.2, 1.8, 1] },
    { kind: 'counter', rect: [9, 6.9, 5.4, 1.3] },
    { kind: 'bed', rect: [23.4, 6.6, 6, 5.2], side: 'e' },
    { kind: 'wardrobe', rect: [21.9, 13.9, 2.1, 5.6] },
    { kind: 'basin', rect: [27.9, 13.9, 1.6, 1.6] },
    { kind: 'wc', rect: [27.3, 17.6, 2.2, 1.4], side: 'e' },
  ],
  labels: [
    { text: 'Toilet', sub: `5'0" × 6'8"`, at: [4.4, 6.2] },
    { text: 'Bedroom 1', sub: `9'0" × 12'0"`, at: [4.2, 11.2] },
    { text: 'Living', sub: `19'0" × 9'0"`, at: [13, 3.4] },
    { text: 'Pantry kitchen', at: [11.7, 6.2] },
    { text: 'TV unit', at: [18.8, 7.5] },
    { text: 'Bedroom 2', sub: `9'0" × 12'0"`, at: [25.6, 4.6] },
    { text: 'Toilet', at: [27.2, 16.6] },
  ],
};

const p600b: PlanDef = {
  id: '600-2',
  area: 600,
  option: 2,
  footprint: "L-shaped · ≈20' × 30' with central courtyard",
  rooms: ['Bedroom 1', 'Bedroom 2', 'Living', 'Pantry kitchen / TV unit', 'Open courtyard', 'Toilet × 2'],
  size: [30, 20],
  outline: SHELL_600,
  partitions: [
    [6.2, 2.8, 6.2, 9.8],
    [0, 9.8, 8.5, 9.8],
    [21.5, 15.4, 30, 15.4],
  ],
  doors: [
    { at: [6.2, 3.3], to: [6.2, 5.7], into: [-1, 0] },
    { at: [6.4, 9.8], to: [8.4, 9.8], into: [0, 1] },
    { at: [8.5, 2.7], to: [8.5, 0.4], into: [1, 0] },
    { at: [15, 8.5], to: [12.6, 8.5], into: [0, -1] },
    { at: [21.5, 6.2], to: [21.5, 3] },
    { at: [26.6, 2.8], to: [29, 2.8], into: [0, 1] },
    { at: [25.4, 15.4], to: [27.8, 15.4], into: [0, -1] },
  ],
  windows: [
    [0, 13.4, 0, 17.8],
    [30, 5, 30, 9.5],
    [11, 0, 16, 0],
  ],
  zones: ZONES_600,
  fixtures: [
    { kind: 'basin', rect: [0.5, 3.3, 1.5, 1.5] },
    { kind: 'wc', rect: [0.5, 5.6, 2.2, 1.4], side: 'w' },
    { kind: 'shower', rect: [0.4, 7.4, 2.2, 2] },
    { kind: 'bed', rect: [0.6, 13.8, 6, 5.2], side: 'w' },
    { kind: 'sofa', rect: [16.6, 0.5, 4.4, 1.6], side: 'n' },
    { kind: 'table', rect: [17.6, 3.2, 1.8, 1] },
    { kind: 'counter', rect: [9, 6.9, 3.2, 1.3] },
    { kind: 'bed', rect: [23.4, 4.4, 6, 5.2], side: 'e' },
    { kind: 'wardrobe', rect: [21.9, 13.4, 6, 1.5] },
    { kind: 'wc', rect: [23, 17.6, 1.5, 2.1], side: 's' },
    { kind: 'basin', rect: [26.4, 18.1, 2.6, 1.5] },
  ],
  labels: [
    { text: 'Toilet', sub: `5'0" × 7'0"`, at: [4.4, 6.4] },
    { text: 'Bedroom 1', sub: `9'0" × 11'8"`, at: [4.2, 11.6] },
    { text: 'Living', sub: `19'0" × 9'0"`, at: [13, 3.4] },
    { text: 'Pantry kitchen', at: [10.8, 6.2] },
    { text: 'TV unit', at: [18.8, 7.5] },
    { text: 'Bedroom 2', sub: `9'0" × 13'0"`, at: [25.6, 11.4] },
    { text: 'Toilet', sub: `9'0" × 5'0"`, at: [25, 16.9] },
  ],
};

export const PLAN_GROUPS: PlanGroup[] = [
  {
    area: 200,
    sqm: '18 sqm',
    footprint: "10' × 20'",
    elevation: 'Two-tone capsule cabin · 6m × 3m × 3m · covered entry porch',
    modules: [{ type: 'extended', x: 0, z: 0, rot: 1, level: 0 }],
    plans: [p200a, p200b],
  },
  {
    area: 300,
    sqm: '27 sqm',
    footprint: "≈20' × 20'",
    elevation: 'Two-module combine · mono-slope roof · ≈10 ft eave height',
    modules: [
      { type: 'extended', x: 0, z: 0, rot: 1, level: 0 },
      { type: 'base', x: 1, z: 1, rot: 0, level: 0 },
    ],
    plans: [p300a, p300b, p300c],
  },
  {
    area: 400,
    sqm: '36 sqm',
    footprint: "20' × 20'",
    elevation: 'Elevated pod · stacked capsule with rooftop deck',
    modules: [
      { type: 'extended', x: 0, z: 0, rot: 3, level: 0 },
      { type: 'extended', x: 1, z: 0, rot: 1, level: 0 },
    ],
    plans: [p400a, p400b],
  },
  {
    area: 600,
    sqm: '54 sqm',
    footprint: "≈20' × 30'",
    elevation: 'Villa-style elevation · hip roof, courtyard entry',
    modules: [
      { type: 'extended', x: 0, z: 0, rot: 1, level: 0 },
      { type: 'base', x: 1, z: 0, rot: 0, level: 0 },
      { type: 'extended', x: 2, z: 0, rot: 3, level: 0 },
    ],
    plans: [p600a, p600b],
  },
];
