import { useEffect, useMemo } from 'react';
import { BufferGeometry, CircleGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape } from 'three';
import { Builder, type BuiltPart } from '../core/builder';
import { L, M, poolMaterial, type MatKey } from '../core/materials';

/** Outline of a standing person, 1.72 m tall (x, y in metres). */
const PERSON: [number, number][] = [
  [-0.15, 0], [-0.03, 0], [0, 0.8], [0.03, 0], [0.15, 0], [0.17, 0.86], [0.2, 0.92], [0.25, 0.86], [0.29, 1.36],
  [0.2, 1.46], [0.07, 1.5], [0.06, 1.55], [-0.06, 1.55], [-0.07, 1.5], [-0.2, 1.46], [-0.29, 1.36], [-0.25, 0.86],
  [-0.2, 0.92], [-0.17, 0.86],
];

let figureGeometry: BufferGeometry | null = null;
function figure(): BufferGeometry {
  if (figureGeometry) return figureGeometry;
  const body = new Shape();
  PERSON.forEach(([x, y], i) => (i ? body.lineTo(x, y) : body.moveTo(x, y)));
  body.closePath();
  const head = new Shape();
  head.absellipse(0, 1.63, 0.092, 0.105, 0, Math.PI * 2);
  figureGeometry = new ExtrudeGeometry([body, head], { depth: 0.03, bevelEnabled: false, curveSegments: 16 });
  figureGeometry.translate(0, 0, -0.015);
  return figureGeometry;
}

/** A flat cut-out figure for scale — the kind placed in architectural models. */
export function ScaleFigure({ position, rotation = 0, height = 1.72 }: { position: [number, number, number]; rotation?: number; height?: number }) {
  const k = height / 1.72;
  return (
    <mesh geometry={figure()} material={M.fabricDark} position={position} rotation={[0, rotation, 0]} scale={k} castShadow />
  );
}

/** Deterministic pseudo-random in [0,1) from an integer seed. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Model-style trees: tall, matte, cypress-like forms that read as silhouettes in the haze. */
export function treeParts(placements: [x: number, z: number, scale: number][], y = 0): BuiltPart[] {
  const b = new Builder();
  placements.forEach(([x, z, s], i) => {
    const h = (5.5 + rand(i * 1.7) * 4.5) * s;
    const r = (0.95 + rand(i * 2.3) * 0.5) * s;
    b.cyl('timberDark', 0.07 * s, 1.2 * s, x, y + 0.6 * s, z, 0, 0, 0, 5);
    b.sphere('foliage', r, x, y + 1.0 * s + h / 2, z, h / (2 * r), 9);
  });
  return b.build();
}

/** Additive pool of light on the ground beneath a subject. */
export function LightPool({ position = [0, 0.03, 0], radius = 12, color = '#ffe9cf', opacity = 0.14 }: { position?: [number, number, number]; radius?: number; color?: string; opacity?: number }) {
  const material = useMemo(() => poolMaterial(color, opacity), [color, opacity]);
  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={material} renderOrder={1}>
      <planeGeometry args={[radius * 2, radius * 2]} />
    </mesh>
  );
}

interface FloorProps {
  mat?: MatKey;
  radius?: number;
  /** Half-extent of the 3 m reference grid, in metres. 0 hides it. */
  grid?: number;
  y?: number;
}

/** Ground plane with an optional 3 m technical grid. */
export function Floor({ mat = 'floor', radius = 260, grid = 0, y = 0 }: FloorProps) {
  const disc = useMemo(() => new CircleGeometry(radius, 48).rotateX(-Math.PI / 2), [radius]);
  const lines = useMemo(() => {
    if (!grid) return null;
    const pts: number[] = [];
    for (let v = -grid; v <= grid + 0.01; v += 3) {
      pts.push(-grid, 0, v, grid, 0, v, v, 0, -grid, v, 0, grid);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pts, 3));
    return g;
  }, [grid]);

  useEffect(() => () => disc.dispose(), [disc]);
  useEffect(() => () => lines?.dispose(), [lines]);

  return (
    <group position={[0, y, 0]}>
      <mesh geometry={disc} material={M[mat]} receiveShadow />
      {lines && <lineSegments geometry={lines} material={L.grid} position={[0, 0.012, 0]} />}
    </group>
  );
}

interface DimLineProps {
  from: [number, number, number];
  to: [number, number, number];
  /** Direction of the end ticks. */
  tick?: [number, number, number];
  tone?: keyof typeof L;
}

/** A dimension line with end ticks, as drawn on a technical sheet. */
export function DimLine({ from, to, tick = [0, 0.18, 0], tone = 'ivory' }: DimLineProps) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const [tx, ty, tz] = tick;
    const pts = [
      ...from, ...to,
      from[0] - tx, from[1] - ty, from[2] - tz, from[0] + tx, from[1] + ty, from[2] + tz,
      to[0] - tx, to[1] - ty, to[2] - tz, to[0] + tx, to[1] + ty, to[2] + tz,
    ];
    g.setAttribute('position', new Float32BufferAttribute(pts, 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.join(), to.join(), tick.join()]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <lineSegments geometry={geometry} material={L[tone]} />;
}
