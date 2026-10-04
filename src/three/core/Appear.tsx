import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Line, Material, Mesh } from 'three';
import { clamp, easeOut } from '../../lib/math';

interface AppearProps {
  /** Returns 0–1 visibility for the current frame. */
  value: () => number;
  /** Metres the content settles downward as it arrives. */
  rise?: number;
  /** Set false when the children already use instance-local materials (e.g. clipped ones). */
  clone?: boolean;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

interface Tracked {
  material: Material;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

/**
 * Fades and settles its children in as `value` goes 0→1.
 * Materials are cloned per instance so the shared library stays opaque.
 */
export function Appear({ value, rise = 0.3, clone = true, children, position, rotation }: AppearProps) {
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const tracked = useRef<Tracked[]>([]);
  const casters = useRef<Mesh[]>([]);
  const last = useRef(-1);

  useLayoutEffect(() => {
    const clones = new Map<Material, Material>();
    const meshes: Mesh[] = [];
    inner.current?.traverse((o) => {
      const node = o as Mesh | Line;
      if (!('material' in node) || Array.isArray(node.material)) return;
      const source = node.material as Material;
      let local = clones.get(source);
      if (!local) {
        local = clone ? source.clone() : source;
        clones.set(source, local);
      }
      node.material = local;
      if ((node as Mesh).isMesh && node.castShadow) meshes.push(node as Mesh);
    });
    tracked.current = [...clones.entries()].map(([source, material]) => ({
      material,
      opacity: source.opacity,
      transparent: source.transparent,
      depthWrite: source.depthWrite,
    }));
    casters.current = meshes;
    last.current = -1;
    return () => {
      if (clone) tracked.current.forEach((t) => t.material.dispose());
    };
  }, [clone]);

  useFrame(() => {
    const v = clamp(value());
    if (v === last.current || !outer.current || !inner.current) return;
    const wasSolid = last.current >= 0.999;
    const solid = v >= 0.999;
    last.current = v;

    outer.current.visible = v > 0.002;
    inner.current.position.y = (1 - easeOut(v)) * rise;
    for (const t of tracked.current) {
      t.material.opacity = t.opacity * v;
      if (solid !== wasSolid || !t.material.userData.appearInit) {
        t.material.userData.appearInit = true;
        t.material.transparent = solid ? t.transparent : true;
        t.material.depthWrite = solid ? t.depthWrite : t.depthWrite && v > 0.5;
        t.material.needsUpdate = true;
      } else if (!solid) {
        t.material.depthWrite = t.depthWrite && v > 0.5;
      }
    }
    const cast = v > 0.6;
    for (const m of casters.current) m.castShadow = cast;
  });

  return (
    <group ref={outer} position={position} rotation={rotation} visible={false}>
      <group ref={inner}>{children}</group>
    </group>
  );
}
