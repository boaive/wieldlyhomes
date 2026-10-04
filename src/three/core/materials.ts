import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  DoubleSide,
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Material,
} from 'three';

/**
 * Shared material library. One instance per surface type keeps shader programs
 * and draw state stable across every scene.
 *
 * The palette follows the brief: dark architectural navy, warm ivory, concrete
 * grey, with Wieldy lime reserved for small technical markers.
 */

/** Soft radial falloff, used additively as a pool of light on a floor. */
function poolTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

const std = (color: string, roughness: number, metalness = 0, extra: Partial<MeshStandardMaterial> = {}) =>
  Object.assign(new MeshStandardMaterial({ color, roughness, metalness }), extra);

export const PALETTE = {
  navy: '#0b1720',
  navyUp: '#101e27',
  ivory: '#f1eee5',
  concrete: '#b8b7ae',
  lime: '#a8c64a',
  brass: '#b69a6a',
} as const;

export const M = {
  concrete: std('#bab8ae', 0.94),
  concreteLight: std('#d3d0c5', 0.9),
  concreteDark: std('#77797a', 0.92),
  slab: std('#18232b', 0.7, 0.1),
  floor: std('#0c1820', 0.8, 0.1),
  steel: std('#1a232a', 0.44, 0.75),
  steelMid: std('#48535b', 0.5, 0.7),
  galv: std('#a2a9ae', 0.4, 0.8),
  cladding: std('#131d25', 0.58, 0.55),
  glass: std('#a6bcc6', 0.06, 0.25, { transparent: true, opacity: 0.24, depthWrite: false }),
  glassDark: std('#0e171d', 0.08, 0.6),
  timber: std('#ad8452', 0.64),
  timberDark: std('#6c4e34', 0.7),
  ivory: std('#ebe7dc', 0.9),
  fabric: std('#b8b0a0', 1),
  fabricDark: std('#56606a', 1),
  sage: std('#6f7d68', 1),
  foliage: std('#3a493f', 1),
  graphite: std('#222c33', 0.5, 0.45),
  insulation: std('#d9c486', 1),
  formwork: std('#3e6b4b', 0.85),
  rebar: std('#8b5e45', 0.6, 0.5),
  brass: std('#b69a6a', 0.36, 0.85),
  pipe: std('#7f98a6', 0.4, 0.5),
  rubber: std('#0e1215', 0.9),
  earth: std('#3d3a31', 1),
  gravel: std('#55554d', 1),
  grass: std('#39453a', 1),
  asphalt: std('#151a1e', 0.9),
  clay: std('#d8d4c8', 0.95),
  tile: std('#b4b7b1', 0.42),
  stone: std('#8a8983', 0.6),
  mirror: std('#cdd5d8', 0.06, 1),
  /** Self-lit interior lining — reads as a warm, occupied space through the glazing. */
  interior: std('#d8cdb9', 0.9, 0, { emissive: new Color('#9a7448'), emissiveIntensity: 0.5 }),
  warmGlow: std('#ffe2b8', 1, 0, { emissive: new Color('#ffc27a'), emissiveIntensity: 2.2 }),
  coolGlow: std('#e9f1f2', 1, 0, { emissive: new Color('#dfeaec'), emissiveIntensity: 1.6 }),
  /** Dim warm glazing band — light spilling from inside a building. */
  windowGlow: std('#ffdcb0', 1, 0, { emissive: new Color('#ffb970'), emissiveIntensity: 1.1 }),
  /** Painted floor markings. */
  marking: std('#c9cdc8', 1),
  lime: new MeshBasicMaterial({ color: PALETTE.lime }),
  ivoryFlat: new MeshBasicMaterial({ color: PALETTE.ivory }),
  shadow: new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false }),
} satisfies Record<string, Material>;

export type MatKey = keyof typeof M;

/** Additive light pool. Tint and strength are set per use through `color` / `opacity`. */
export const poolMaterial = (color: string, opacity: number) =>
  new MeshBasicMaterial({ map: poolTexture(), color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, fog: false });

export const L = {
  ivory: new LineBasicMaterial({ color: PALETTE.ivory, transparent: true, opacity: 0.7 }),
  ivoryDim: new LineBasicMaterial({ color: PALETTE.ivory, transparent: true, opacity: 0.22 }),
  lime: new LineBasicMaterial({ color: PALETTE.lime, transparent: true, opacity: 0.95 }),
  grid: new LineBasicMaterial({ color: '#7f97a4', transparent: true, opacity: 0.16 }),
} as const;

/** Flat "poché" material for the cut faces of a sectioned layer. */
export const sectionCap = (color: string) => new MeshBasicMaterial({ color, side: BackSide });

export const doubleSided = <T extends Material>(m: T): T => {
  m.side = DoubleSide;
  return m;
};
