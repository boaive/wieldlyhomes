import { useEffect } from 'react';
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Euler,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
  type Material,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { M, type MatKey } from './materials';

export interface BuiltPart {
  mat: MatKey;
  geometry: BufferGeometry;
}

const _m = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _p = new Vector3();
const _s = new Vector3(1, 1, 1);

/**
 * Accumulates primitives and merges them into one geometry per material.
 * Static set dressing built this way costs a single draw call per material,
 * however many pieces it contains.
 */
export class Builder {
  private parts = new Map<MatKey, BufferGeometry[]>();

  add(mat: MatKey, geometry: BufferGeometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): this {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s);
    g.applyMatrix4(_m);
    const list = this.parts.get(mat);
    if (list) list.push(g);
    else this.parts.set(mat, [g]);
    return this;
  }

  /** Box of size (sx, sy, sz) centred at (x, y, z). */
  box(mat: MatKey, sx: number, sy: number, sz: number, x: number, y: number, z: number, ry = 0, rx = 0, rz = 0): this {
    return this.add(mat, new BoxGeometry(sx, sy, sz), x, y, z, rx, ry, rz);
  }

  /** Vertical cylinder of radius r and height h centred at (x, y, z). */
  cyl(mat: MatKey, r: number, h: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, seg = 16, rTop = r): this {
    return this.add(mat, new CylinderGeometry(rTop, r, h, seg), x, y, z, rx, ry, rz);
  }

  sphere(mat: MatKey, r: number, x: number, y: number, z: number, sy = 1, seg = 16): this {
    const g = new SphereGeometry(r, seg, Math.max(8, seg / 2));
    g.scale(1, sy, 1);
    return this.add(mat, g, x, y, z);
  }

  /** A straight member between two points, square in section. */
  beam(mat: MatKey, t: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number): this {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    const g = new BoxGeometry(t, len, t).toNonIndexed();
    _q.setFromUnitVectors(_p.set(0, 1, 0), new Vector3(dx / len, dy / len, dz / len));
    _m.compose(new Vector3((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), _q, _s);
    g.applyMatrix4(_m);
    const list = this.parts.get(mat);
    if (list) list.push(g);
    else this.parts.set(mat, [g]);
    return this;
  }

  build(): BuiltPart[] {
    const out: BuiltPart[] = [];
    for (const [mat, list] of this.parts) {
      const geometry = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (list.length > 1) list.forEach((g) => g.dispose());
      if (geometry) out.push({ mat, geometry });
    }
    this.parts.clear();
    return out;
  }
}

export const disposeParts = (parts: BuiltPart[]) => parts.forEach((p) => p.geometry.dispose());

interface BuiltProps {
  parts: BuiltPart[];
  /** Dispose the geometries on unmount. Disable for geometry held in a shared cache. */
  owned?: boolean;
  cast?: boolean;
  receive?: boolean;
  /** Per-material overrides, e.g. instance-local clipped materials. */
  materials?: Partial<Record<MatKey, Material>>;
}

/** Renders merged parts — one mesh per material. */
export function Built({ parts, owned = true, cast = true, receive = true, materials }: BuiltProps) {
  useEffect(() => {
    if (!owned) return;
    return () => disposeParts(parts);
  }, [parts, owned]);

  return (
    <>
      {parts.map((p) => (
        <mesh
          key={p.mat}
          geometry={p.geometry}
          material={materials?.[p.mat] ?? M[p.mat]}
          castShadow={cast && p.mat !== 'glass'}
          receiveShadow={receive}
        />
      ))}
    </>
  );
}
