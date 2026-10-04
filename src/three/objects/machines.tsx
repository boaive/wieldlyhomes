import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { vehicleAssets } from '../../config/assets';
import { SPREADER_H, TRAILER } from '../../lib/dimensions';
import { Builder, Built } from '../core/builder';
import { M } from '../core/materials';
import { ModelSlot } from '../core/ModelSlot';

/* -------------------------------------------------------------------------- */
/*  Overhead hoist — spreader frame and slings, cables rising out of frame     */
/* -------------------------------------------------------------------------- */

export { SPREADER_H, TRAILER };

/**
 * Overhead hoist. Place the group at the roof centre of the module being
 * carried (y = top of roof); scale.x 0.5 fits a base capsule.
 */
export const Hoist = forwardRef<Group>(function Hoist(_, ref) {
  const parts = useMemo(() => {
    const b = new Builder();
    const hx = 2.5;
    const hz = 1.0;
    b.box('steelMid', hx * 2 + 0.3, 0.16, 0.14, 0, SPREADER_H, -hz).box('steelMid', hx * 2 + 0.3, 0.16, 0.14, 0, SPREADER_H, hz);
    b.box('steelMid', 0.14, 0.16, hz * 2, -hx, SPREADER_H, 0).box('steelMid', 0.14, 0.16, hz * 2, hx, SPREADER_H, 0);
    b.box('steelMid', 0.14, 0.16, hz * 2, 0, SPREADER_H, 0);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        b.cyl('galv', 0.018, SPREADER_H - 0.1, sx * hx, SPREADER_H / 2, sz * hz, 0, 0, 0, 6);
        b.box('galv', 0.12, 0.12, 0.12, sx * hx, 0.1, sz * hz);
      }
    }
    for (const sx of [-1, 1]) b.cyl('galv', 0.022, 46, sx * 1.2, SPREADER_H + 23, 0, 0, 0, 0, 6);
    b.box('steel', 3.0, 0.3, 0.5, 0, SPREADER_H + 0.2, 0);
    return b.build();
  }, []);
  return (
    <group ref={ref}>
      <Built parts={parts} receive={false} />
    </group>
  );
});

/* -------------------------------------------------------------------------- */
/*  Flatbed truck                                                              */
/* -------------------------------------------------------------------------- */

export function Truck() {
  const parts = useMemo(() => {
    const b = new Builder();
    // Trailer
    b.box('steel', 12.6, 0.2, 2.56, -3.2, 1.16, 0);
    b.box('steelMid', 12.6, 0.08, 0.08, -3.2, 1.22, 1.28).box('steelMid', 12.6, 0.08, 0.08, -3.2, 1.22, -1.28);
    b.box('steel', 11, 0.34, 0.5, -3.6, 0.9, 0);
    for (const x of [-8.3, -7.0, -5.7]) {
      for (const z of [-1.05, 1.05]) {
        b.cyl('rubber', 0.52, 0.36, x, 0.52, z, Math.PI / 2, 0, 0, 20);
        b.cyl('galv', 0.2, 0.37, x, 0.52, z, Math.PI / 2, 0, 0, 12);
      }
    }
    b.box('steel', 0.1, 0.9, 0.1, 0.4, 0.55, 0.9).box('steel', 0.1, 0.9, 0.1, 0.4, 0.55, -0.9);
    // Tractor
    b.box('steel', 4.6, 0.36, 1.1, 4.2, 0.82, 0);
    b.box('graphite', 2.1, 2.25, 2.46, 5.35, 2.1, 0);
    b.box('graphite', 0.5, 1.0, 2.46, 6.5, 1.45, 0);
    b.box('glassDark', 0.06, 0.95, 2.2, 6.42, 2.62, 0);
    b.box('glassDark', 1.0, 0.72, 2.5, 5.75, 2.62, 0);
    b.box('ivory', 2.12, 0.05, 2.48, 5.35, 1.6, 0);
    b.box('steel', 0.08, 0.6, 2.0, 6.76, 1.3, 0);
    b.box('steel', 0.4, 0.3, 2.5, 6.7, 0.72, 0);
    b.box('warmGlow', 0.04, 0.12, 0.3, 6.92, 0.95, 0.9).box('warmGlow', 0.04, 0.12, 0.3, 6.92, 0.95, -0.9);
    b.box('steel', 1.4, 0.1, 2.3, 3.0, 1.08, 0);
    for (const x of [5.6, 3.3, 2.1]) {
      for (const z of [-1.08, 1.08]) {
        b.cyl('rubber', 0.52, 0.34, x, 0.52, z, Math.PI / 2, 0, 0, 20);
        b.cyl('galv', 0.2, 0.35, x, 0.52, z, Math.PI / 2, 0, 0, 12);
      }
    }
    return b.build();
  }, []);
  return (
    <ModelSlot src={vehicleAssets.truck}>
      <Built parts={parts} />
    </ModelSlot>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mobile crane — "simple lifting equipment" on site                          */
/* -------------------------------------------------------------------------- */

export interface CraneHandle {
  /**
   * Aim the boom so the hook hangs at a point given in the crane's parent
   * frame. `yaw` squares the slings to the carried module; `half` is half the
   * module length (2.5 for an extended capsule, 1 for a base capsule). Pass
   * `carrying: false` to stow the slings while the hook is empty.
   */
  reach: (x: number, y: number, z: number, yaw?: number, half?: number, carrying?: boolean) => void;
}

const PIVOT_Y = 2.6;
const TIP_MARGIN = 5.5;

export const MobileCrane = forwardRef<CraneHandle, { position: [number, number, number]; rotation?: number }>(
  function MobileCrane({ position, rotation = 0 }, ref) {
    const slew = useRef<Group>(null);
    const boom = useRef<Group>(null);
    const inner = useRef<Mesh>(null);
    const line = useRef<Group>(null);
    const cable = useRef<Mesh>(null);
    const hookRef = useRef<Group>(null);

    const carrier = useMemo(() => {
      const b = new Builder();
      b.box('graphite', 8.2, 0.8, 2.5, 0.3, 1.15, 0);
      b.box('graphite', 1.9, 1.25, 2.5, 3.6, 2.1, 0);
      b.box('glassDark', 0.06, 0.7, 2.2, 4.57, 2.25, 0);
      for (const x of [3.4, 1.6, -1.2, -2.6]) {
        for (const z of [-1.1, 1.1]) b.cyl('rubber', 0.58, 0.4, x, 0.58, z, Math.PI / 2, 0, 0, 20);
      }
      for (const x of [2.4, -3.3]) {
        b.box('steelMid', 0.32, 0.26, 6.6, x, 0.95, 0);
        for (const z of [-3.2, 3.2]) {
          b.cyl('galv', 0.09, 0.8, x, 0.5, z, 0, 0, 0, 10);
          b.box('steelMid', 0.9, 0.1, 0.9, x, 0.05, z);
        }
      }
      b.cyl('steelMid', 1.0, 0.3, -0.6, 1.7, 0, 0, 0, 0, 24);
      return b.build();
    }, []);

    const upper = useMemo(() => {
      const b = new Builder();
      b.box('graphite', 3.6, 0.9, 2.2, -0.9, 0.55, 0);
      b.box('steelMid', 1.2, 1.1, 2.3, -2.6, 0.75, 0);
      b.box('graphite', 1.3, 1.3, 0.9, 1.0, 0.95, 0.95);
      b.box('glassDark', 0.06, 0.8, 0.8, 1.66, 1.1, 0.95);
      return b.build();
    }, []);

    const hook = useMemo(() => {
      const b = new Builder();
      b.box('steel', 0.34, 0.5, 0.26, 0, 0.25, 0);
      return b.build();
    }, []);
    const slings = useMemo(() => {
      // Four slings down to the lifting anchors of the carried module.
      const b = new Builder();
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.beam('galv', 0.03, 0, 0, 0, sx * 2.5, -SPREADER_H, sz * 1.0);
      return b.build();
    }, []);
    const slingRef = useRef<Group>(null);

    useImperativeHandle(ref, () => ({
      reach: (x, y, z, yaw = 0, half = 2.5, carrying = true) => {
        const s = slew.current;
        const bm = boom.current;
        if (!s || !bm) return;
        // Into the crane's local frame, measured from the boom pivot.
        const lx = x - position[0];
        const lz = z - position[2];
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const px = lx * cos - lz * sin + 0.6;
        const pz = lx * sin + lz * cos;
        const r = Math.max(3, Math.hypot(px, pz));
        const tipY = Math.max(13, y + TIP_MARGIN);
        const rise = tipY - PIVOT_Y;
        const length = Math.hypot(r, rise);
        s.rotation.y = Math.atan2(-pz, px);
        bm.rotation.z = Math.atan2(rise, r);
        if (inner.current) {
          const ext = Math.max(0.1, length - 8.2);
          inner.current.scale.x = ext;
          inner.current.position.x = 8.2 + ext / 2;
        }
        if (line.current && cable.current && hookRef.current) {
          // The cable hangs world-vertical from the boom tip.
          line.current.position.set(length, 0, 0);
          line.current.rotation.z = -bm.rotation.z;
          const drop = Math.max(0.5, tipY - y);
          cable.current.scale.y = drop;
          cable.current.position.y = -drop / 2;
          hookRef.current.position.y = -drop;
          hookRef.current.rotation.y = yaw - rotation - s.rotation.y;
          hookRef.current.scale.x = half / 2.5;
          if (slingRef.current) slingRef.current.visible = carrying;
        }
      },
    }));

    return (
      <group position={position} rotation={[0, rotation, 0]}>
        <ModelSlot src={vehicleAssets.crane}>
          <Built parts={carrier} />
          <group ref={slew} position={[-0.6, 1.85, 0]}>
            <Built parts={upper} />
            <group ref={boom} position={[0, PIVOT_Y - 1.85, 0]}>
              <mesh position={[4.5, 0, 0]} material={M.ivory} castShadow>
                <boxGeometry args={[9, 0.72, 0.66]} />
              </mesh>
              <mesh ref={inner} position={[10, 0, 0]} material={M.galv} castShadow>
                <boxGeometry args={[1, 0.52, 0.48]} />
              </mesh>
              <group ref={line}>
                <mesh ref={cable} material={M.galv}>
                  <cylinderGeometry args={[0.025, 0.025, 1, 6]} />
                </mesh>
                <group ref={hookRef}>
                  <Built parts={hook} receive={false} />
                  <group ref={slingRef}>
                    <Built parts={slings} receive={false} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </ModelSlot>
      </group>
    );
  },
);
