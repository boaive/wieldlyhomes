import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane, Vector3, type Group, type Material, type Mesh, type MeshStandardMaterial } from 'three';
import { ALL_EXPOSED } from '../../lib/grid';
import { lerp, smooth } from '../../lib/math';
import { Appear } from '../core/Appear';
import { Builder, Built, type BuiltPart } from '../core/builder';
import { M, sectionCap, type MatKey } from '../core/materials';
import { addCladding, addGlazing, addRoofKit, addShell } from './shell';

/**
 * The layered extended capsule (6m × 3m × 3m) used wherever the product is
 * explained: factory stations, the sectional reveal, Why Wieldy and the
 * construction story. Every layer is driven by a 0–1 value in `HeroState`.
 */
export interface HeroState {
  frame: number;
  insulation: number;
  services: number;
  /** Formwork on the back and left end. */
  formwork: number;
  /** Formwork on the front and right end — closes the form. */
  formFront: number;
  /** Opacity of the concrete skin (lower for an x-ray view). */
  skin: number;
  /** Fill level of the concrete, 0 = empty form, 1 = cast. */
  pour: number;
  lining: number;
  finish: number;
  furniture: number;
  /** Sectional cut through the front corner, 0 = intact. */
  cut: number;
}

export const heroState = (init: Partial<HeroState> = {}): HeroState => ({
  frame: 1,
  insulation: 1,
  services: 1,
  formwork: 0,
  formFront: 0,
  skin: 1,
  pour: 1,
  lining: 1,
  finish: 1,
  furniture: 1,
  cut: 0,
  ...init,
});

interface HeroGeometry {
  frame: BuiltPart[];
  insulation: BuiltPart[];
  services: BuiltPart[];
  formwork: BuiltPart[];
  formFront: BuiltPart[];
  concrete: BuiltPart[];
  lining: BuiltPart[];
  envelope: BuiltPart[];
  fitout: BuiltPart[];
  furniture: BuiltPart[];
}

let shared: HeroGeometry | null = null;

/** Built once and shared by every HeroModule instance. */
function heroGeometry(): HeroGeometry {
  if (shared) return shared;
  const T = 'extended' as const;

  // Structural frame — sits in the insulation zone of the wall build-up.
  const f = new Builder();
  const post = (x: number, z: number) => f.box('galv', 0.075, 2.76, 0.075, x, 1.5, z);
  const FZ = 1.385;
  const FX = 2.885;
  [-FX, -2.72, -0.24, 0.9, 1.69, 2.66, FX].forEach((x) => post(x, FZ));
  [-FX, -2.36, -0.64, 0, 0.64, 2.36, FX].forEach((x) => post(x, -FZ));
  [-0.36, 0.36].forEach((z) => post(-FX, z));
  [-0.7, 0, 0.7].forEach((z) => post(FX, z));
  for (const y of [0.12, 2.88]) {
    f.box('galv', 5.84, 0.075, 0.075, 0, y, FZ).box('galv', 5.84, 0.075, 0.075, 0, y, -FZ);
    f.box('galv', 0.075, 0.075, 2.7, -FX, y, 0).box('galv', 0.075, 0.075, 2.7, FX, y, 0);
    for (let x = -2.4; x <= 2.41; x += 0.6) f.box('galv', 0.055, 0.075, 2.7, x, y, 0);
  }
  f.box('galv', 2.5, 0.075, 0.075, -1.48, 2.6, FZ);
  f.box('galv', 0.98, 0.075, 0.075, 2.175, 2.34, FZ).box('galv', 0.98, 0.075, 0.075, 2.175, 0.91, FZ);
  for (const c of [-1.5, 1.5]) {
    f.box('galv', 1.74, 0.075, 0.075, c, 1.86, -FZ).box('galv', 1.74, 0.075, 0.075, c, 2.39, -FZ);
  }

  const ins = new Builder();
  addShell(ins, T, ALL_EXPOSED, { mat: 'insulation', inset: 0.086, thick: 0.068 });

  // Services — brass conduit for electrical, steel-blue for plumbing.
  const s = new Builder();
  const SZ = -1.325;
  s.box('brass', 5.3, 0.03, 0.03, 0, 2.55, SZ);
  for (const x of [-2.25, -0.45, 1.25]) {
    s.box('brass', 0.03, 1.45, 0.03, x, 1.83, SZ);
    s.box('steel', 0.1, 0.1, 0.045, x, 1.08, SZ + 0.01);
  }
  for (const x of [-1.5, 1.2]) {
    s.box('brass', 0.03, 0.27, 0.03, x, 2.68, SZ);
    s.box('brass', 0.03, 0.03, 1.33, x, 2.815, SZ + 0.665);
    s.cyl('steel', 0.06, 0.03, x, 2.815, 0, 0, 0, 0, 12);
  }
  s.box('steel', 0.3, 0.42, 0.07, 0.42, 1.5, SZ + 0.02);
  s.cyl('pipe', 0.022, 1.25, 2.62, 0.78, SZ, 0, 0, 0, 10);
  s.cyl('pipe', 0.022, 1.25, 2.52, 0.78, SZ, 0, 0, 0, 10);
  s.cyl('pipe', 0.022, 1.5, 1.87, 0.52, SZ, 0, 0, Math.PI / 2, 10);
  s.cyl('pipe', 0.022, 1.4, 1.82, 0.62, SZ, 0, 0, Math.PI / 2, 10);
  s.cyl('pipe', 0.05, 2.5, 2.3, 0.2, 0, Math.PI / 2, 0, 0, 12);

  // Formwork — green panels, walers and raking props. Built in two halves so
  // a form can be shown open (back + left end) or closed (all four sides).
  const formHalf = (zSides: number[], xSides: number[]) => {
    const fw = new Builder();
    for (const sz of zSides) {
      fw.box('formwork', 6.3, 3.06, 0.05, 0, 1.53, sz * 1.555);
      for (const x of [-1.5, 0, 1.5]) fw.box('steel', 0.012, 3.06, 0.012, x, 1.53, sz * 1.585);
      for (const y of [0.55, 1.5, 2.45]) fw.box('timberDark', 6.34, 0.09, 0.08, 0, y, sz * 1.62);
      for (const x of [-2.2, 0, 2.2]) {
        fw.beam('steelMid', 0.06, x, 2.3, sz * 1.66, x, -0.3, sz * 3.0);
        fw.box('steelMid', 0.3, 0.04, 0.3, x, -0.3, sz * 3.0);
      }
    }
    for (const sx of xSides) {
      fw.box('formwork', 0.05, 3.06, 3.16, sx * 3.055, 1.53, 0);
      for (const y of [0.55, 1.5, 2.45]) fw.box('timberDark', 0.08, 0.09, 3.3, sx * 3.12, y, 0);
      fw.beam('steelMid', 0.06, sx * 3.16, 2.3, 0, sx * 4.5, -0.3, 0);
      fw.box('steelMid', 0.3, 0.04, 0.3, sx * 4.5, -0.3, 0);
    }
    return fw.build();
  };

  const c = new Builder();
  addShell(c, T, ALL_EXPOSED, { mat: 'concrete', inset: 0, thick: 0.08 });

  const li = new Builder();
  addShell(li, T, ALL_EXPOSED, { mat: 'concreteLight', inset: 0.16, thick: 0.04 });

  const env = new Builder();
  addGlazing(env, T, ALL_EXPOSED);
  addCladding(env, T, ALL_EXPOSED);
  addRoofKit(env, T);

  // Fit-out: flooring, tiles and the wet-zone partition.
  const fit = new Builder();
  fit.box('timber', 4.5, 0.02, 2.6, -0.55, 0.21, 0);
  fit.box('tile', 1.08, 0.022, 2.6, 2.26, 0.211, 0);
  fit.box('ivory', 0.06, 2.58, 1.72, 1.7, 1.5, -0.44);
  fit.box('warmGlow', 3.2, 0.014, 0.07, -0.8, 2.79, -0.95);

  const fu = new Builder();
  fu.box('timberDark', 1.56, 0.26, 2.02, 0.74, 0.35, -0.27);
  fu.box('ivory', 1.5, 0.17, 1.96, 0.74, 0.565, -0.27);
  fu.box('fabric', 0.62, 0.1, 0.38, 0.38, 0.69, -1.02).box('fabric', 0.62, 0.1, 0.38, 1.1, 0.69, -1.02);
  fu.box('fabricDark', 1.52, 0.025, 0.72, 0.74, 0.66, 0.3);
  fu.box('timber', 1.62, 0.95, 0.05, 0.74, 0.72, -1.265);
  fu.box('timber', 0.42, 0.04, 0.3, -0.26, 0.6, -1.13);
  fu.box('timber', 1.2, 2.32, 0.56, -2.14, 1.38, -1.01);
  fu.box('steel', 0.012, 2.2, 0.01, -2.14, 1.38, -0.728);
  fu.box('fabric', 1.9, 0.014, 1.3, -1.45, 0.227, 0.3);
  fu.cyl('steel', 0.006, 0.52, -1.45, 2.53, 0.3, 0, 0, 0, 6);
  fu.cyl('brass', 0.13, 0.15, -1.45, 2.2, 0.3, 0, 0, 0, 20, 0.05);
  fu.sphere('warmGlow', 0.045, -1.45, 2.13, 0.3);
  fu.box('timber', 0.86, 0.5, 0.4, 2.27, 0.57, -1.07);
  fu.box('stone', 0.92, 0.06, 0.46, 2.27, 0.85, -1.05);
  fu.cyl('ivory', 0.15, 0.06, 2.27, 0.91, -1.05, 0, 0, 0, 20, 0.17);
  fu.box('mirror', 0.6, 0.72, 0.016, 2.27, 1.6, -1.288);
  fu.box('glass', 0.016, 2.0, 0.9, 1.98, 1.22, 0.78);

  shared = {
    frame: f.build(),
    insulation: ins.build(),
    services: s.build(),
    formwork: formHalf([-1], [-1]),
    formFront: formHalf([1], [1]),
    concrete: c.build(),
    lining: li.build(),
    envelope: env.build(),
    fitout: fit.build(),
    furniture: fu.build(),
  };
  return shared;
}

const NX = new Vector3(-1, 0, 0);
const NY = new Vector3(0, -1, 0);
const NZ = new Vector3(0, 0, -1);

/** Final position of each layer's section cut: [x, y, z] of the removed corner. */
const CUTS = {
  concrete: [-0.7, 0.09, -1.05],
  insulation: [-0.42, 0.16, -0.8],
  lining: [-0.14, 0.21, -0.55],
} as const;
const OPEN = [3.4, 3.4, 1.9] as const;

const clipped = <T extends Material>(source: T, planes: Plane[]): T => {
  const m = source.clone() as T;
  m.clippingPlanes = planes;
  m.clipIntersection = true;
  m.clipShadows = true;
  return m;
};

interface HeroModuleProps {
  /** Mutable layer state, written by the owning scene each frame. */
  state: HeroState;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function HeroModule({ state, position, rotation }: HeroModuleProps) {
  const geo = useMemo(heroGeometry, []);
  const root = useRef<Group>(null);
  const pour = useRef<Group>(null);
  const caps = useRef<(Mesh | null)[]>([]);

  const mats = useMemo(() => {
    const planes = {
      concrete: [new Plane(), new Plane(), new Plane()],
      insulation: [new Plane(), new Plane(), new Plane()],
      lining: [new Plane(), new Plane(), new Plane()],
    };
    const cap = (color: string, set: Plane[]) => {
      const m = sectionCap(color);
      m.clippingPlanes = set;
      m.clipIntersection = true;
      return m;
    };
    const envelope: Partial<Record<MatKey, Material>> = {
      steel: clipped(M.steel, planes.concrete),
      glass: clipped(M.glass, planes.concrete),
      timber: clipped(M.timber, planes.concrete),
      galv: clipped(M.galv, planes.concrete),
    };
    return {
      planes,
      concrete: clipped(M.concrete as MeshStandardMaterial, planes.concrete),
      insulation: clipped(M.insulation as MeshStandardMaterial, planes.insulation),
      lining: clipped(M.concreteLight as MeshStandardMaterial, planes.lining),
      capConcrete: cap('#ece8dd', planes.concrete),
      capInsulation: cap('#e6d294', planes.insulation),
      capLining: cap('#f6f3ec', planes.lining),
      envelope,
    };
  }, []);

  useEffect(
    () => () => {
      [mats.concrete, mats.insulation, mats.lining, mats.capConcrete, mats.capInsulation, mats.capLining].forEach((m) => m.dispose());
      Object.values(mats.envelope).forEach((m) => m?.dispose());
    },
    [mats],
  );

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    if (pour.current) pour.current.scale.y = Math.max(0.0015, state.pour);

    const cutting = state.cut > 0.001;
    for (const mesh of caps.current) if (mesh) mesh.visible = cutting;

    g.updateWorldMatrix(true, false);
    const stages: [keyof typeof CUTS, number][] = [
      ['concrete', smooth(state.cut, 0, 0.62)],
      ['insulation', smooth(state.cut, 0.18, 0.82)],
      ['lining', smooth(state.cut, 0.38, 1)],
    ];
    for (const [layer, t] of stages) {
      const [ax, ay, az] = CUTS[layer];
      const set = mats.planes[layer];
      set[0].set(NX, lerp(OPEN[0], ax, t)).applyMatrix4(g.matrixWorld);
      set[1].set(NY, lerp(OPEN[1], ay, t)).applyMatrix4(g.matrixWorld);
      set[2].set(NZ, lerp(OPEN[2], az, t)).applyMatrix4(g.matrixWorld);
    }
  });

  return (
    <group ref={root} position={position} rotation={rotation}>
      <Appear value={() => state.frame}>
        <Built parts={geo.frame} owned={false} />
      </Appear>

      <Appear value={() => state.insulation} clone={false}>
        <mesh geometry={geo.insulation[0].geometry} material={mats.insulation} castShadow receiveShadow />
        <mesh ref={(m) => void (caps.current[0] = m)} geometry={geo.insulation[0].geometry} material={mats.capInsulation} />
      </Appear>

      <Appear value={() => state.services}>
        <Built parts={geo.services} owned={false} />
      </Appear>

      <Appear value={() => state.formwork} rise={0}>
        <Built parts={geo.formwork} owned={false} />
      </Appear>
      <Appear value={() => state.formFront} rise={0}>
        <Built parts={geo.formFront} owned={false} />
      </Appear>

      <Appear value={() => state.skin} rise={0} clone={false}>
        <group ref={pour}>
          <mesh geometry={geo.concrete[0].geometry} material={mats.concrete} castShadow receiveShadow />
          <mesh ref={(m) => void (caps.current[1] = m)} geometry={geo.concrete[0].geometry} material={mats.capConcrete} />
        </group>
      </Appear>

      <Appear value={() => state.lining} clone={false}>
        <mesh geometry={geo.lining[0].geometry} material={mats.lining} receiveShadow />
        <mesh ref={(m) => void (caps.current[2] = m)} geometry={geo.lining[0].geometry} material={mats.capLining} />
      </Appear>

      <Appear value={() => state.finish} clone={false}>
        <Built parts={geo.envelope} owned={false} materials={mats.envelope} />
      </Appear>
      <Appear value={() => state.finish}>
        <Built parts={geo.fitout} owned={false} />
      </Appear>

      <Appear value={() => state.furniture}>
        <Built parts={geo.furniture} owned={false} />
      </Appear>
    </group>
  );
}
