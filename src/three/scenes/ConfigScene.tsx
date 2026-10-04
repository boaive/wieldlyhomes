import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { BufferGeometry, CircleGeometry, Float32BufferAttribute, MeshBasicMaterial, TorusGeometry, type Group } from 'three';
import {
  ALL_EXPOSED,
  CELL,
  GRID_D,
  GRID_W,
  MODULE_H,
  exposureMask,
  rotationY,
  worldCenter,
  type ModuleType,
  type Slot,
} from '../../lib/grid';
import { damp } from '../../lib/math';
import { liftPose, planShipment, yardModule, yardTruck, type ShipPose, type TruckPose } from '../../lib/shipping';
import { DOCK, currentSlots, flights, restPose, shippedModules, useConfig, type Pose3 } from '../../state/config';
import { scroll, useStage } from '../../state/stage';
import { Appear } from '../core/Appear';
import { Builder, Built } from '../core/builder';
import { Callout } from '../core/Callout';
import { director, onScreen } from '../core/director';
import { L, M } from '../core/materials';
import { Capsule, CapsuleOutline } from '../objects/Capsule';
import { Floor, LightPool } from '../objects/dressing';
import { Hoist, Truck } from '../objects/machines';
import { HEIGHT } from '../objects/shell';

const padW = GRID_W * CELL;
const padD = GRID_D * CELL;

const ringGeometry = new TorusGeometry(0.42, 0.022, 6, 40).rotateX(Math.PI / 2);
const hitGeometry = new CircleGeometry(1.2, 20).rotateX(-Math.PI / 2);
const hitMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function buildPad() {
  const b = new Builder();
  b.box('slab', padW + 1.6, 0.06, padD + 1.6, 0, -0.03, 0);
  for (const sz of [-1, 1]) b.box('marking', padW, 0.008, 0.05, 0, 0.004, (sz * padD) / 2);
  for (const sx of [-1, 1]) b.box('marking', 0.05, 0.008, padD, (sx * padW) / 2, 0.004, 0);
  // Dock: a small slab and bearers for the stock capsules.
  const dx = DOCK.base.x;
  b.box('slab', 4.6, 0.06, 12.4, dx, -0.03, -1.4);
  for (const z of [-0.9, 0.9]) b.box('steel', 3.4, DOCK.base.y, 0.25, dx, DOCK.base.y / 2, DOCK.base.z + z);
  for (const z of [-2.2, 0, 2.2]) b.box('steel', 3.4, DOCK.extended.y, 0.25, dx, DOCK.extended.y / 2, DOCK.extended.z + z);
  return b.build();
}

function buildGrid() {
  const pts: number[] = [];
  for (let i = 0; i <= GRID_W; i++) {
    const x = (i - GRID_W / 2) * CELL;
    pts.push(x, 0.01, -padD / 2, x, 0.01, padD / 2);
  }
  for (let j = 0; j <= GRID_D; j++) {
    const z = (j - GRID_D / 2) * CELL;
    pts.push(-padW / 2, 0.01, z, padW / 2, 0.01, z);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return g;
}

function buildCross() {
  const b = new Builder();
  b.box('lime', 0.5, 0.02, 0.045, 0, 0, 0).box('lime', 0.045, 0.02, 0.5, 0, 0, 0);
  return b.build();
}

const inViewport = (e: ThreeEvent<MouseEvent | PointerEvent>) =>
  !!(e.nativeEvent.target as Element | null)?.closest?.('[data-viewport="config"]');

const _pose: Pose3 = { x: 0, y: 0, z: 0, ry: 0 };
const _ship: ShipPose = { x: 0, y: 0, z: 0, ry: 0, lift: -1 };
const _truck: TruckPose = { x: 0, z: 0, visible: false };

/** The configurator: pad, dock, placed capsules, connection points and the hoist. */
export default function ConfigScene() {
  const chapter = useStage((s) => s.chapter);
  const modules = useConfig((s) => s.modules);
  const departing = useConfig((s) => s.departing);
  const selectedId = useConfig((s) => s.selectedId);
  const tool = useConfig((s) => s.tool);
  const toolRot = useConfig((s) => s.toolRot);
  const level = useConfig((s) => s.level);
  const busy = useConfig((s) => s.busy);
  const hoverSlot = useConfig((s) => s.hoverSlot);
  const select = useConfig((s) => s.select);
  const applySlot = useConfig((s) => s.applySlot);
  const setHoverSlot = useConfig((s) => s.setHoverSlot);

  const journey = chapter === 'journey';
  const interactive = chapter === 'configure' && !busy;

  const list = useMemo(() => (journey ? shippedModules(modules) : modules), [journey, modules]);
  const masks = useMemo(() => new Map(list.map((m) => [m.id, exposureMask(m, list)])), [list]);
  const shipment = useMemo(() => planShipment(list), [list]);
  const shipIndex = useMemo(() => new Map(shipment.order.map((m, i) => [m.id, i])), [shipment]);
  const slots = useMemo(
    () => (interactive ? currentSlots({ modules, selectedId, tool, toolRot, level }) : []),
    [interactive, modules, selectedId, tool, toolRot, level],
  );
  const hovered = slots.find((s) => s.key === hoverSlot) ?? null;

  const pad = useMemo(buildPad, []);
  const grid = useMemo(buildGrid, []);
  const cross = useMemo(buildCross, []);

  const groups = useRef(new Map<string, Group>());
  const hoists = useRef<(Group | null)[]>([]);
  const trucks = useRef<(Group | null)[]>([]);
  const stock = useMemo(() => ({ base: 1, extended: 1 }), []);

  const register = (id: string) => (g: Group | null) => {
    if (g) groups.current.set(id, g);
    else groups.current.delete(id);
  };

  useFrame((_, dt) => {
    if (!onScreen('config')) return;
    const inJourney = scroll.chapter === 'journey';
    const p = scroll.p.journey;
    let hook = 0;

    const carry = (x: number, y: number, z: number, ry: number, type: ModuleType) => {
      const h = hoists.current[hook++];
      if (!h) return;
      h.visible = true;
      h.position.set(x, y + HEIGHT, z);
      h.rotation.y = ry;
      h.scale.x = type === 'base' ? 0.44 : 1;
    };

    for (const m of list) {
      const g = groups.current.get(m.id);
      if (!g) continue;
      if (inJourney) {
        yardModule(shipIndex.get(m.id) ?? 0, p, shipment, _ship);
        g.position.set(_ship.x, _ship.y, _ship.z);
        g.rotation.y = _ship.ry;
        if (_ship.lift >= 0) carry(_ship.x, _ship.y, _ship.z, _ship.ry, m.type);
        continue;
      }
      const f = flights.get(m.id);
      const pose = f ? liftPose(f.t, f.from, f.to, f.clearance, _pose) : restPose(m);
      g.position.set(pose.x, pose.y, pose.z);
      g.rotation.y = pose.ry;
      if (f && f.t > 0 && f.t < 1) carry(pose.x, pose.y, pose.z, pose.ry, m.type);
    }
    for (const m of departing) {
      const g = groups.current.get(m.id);
      const f = flights.get(m.id);
      if (!g || !f) continue;
      const pose = liftPose(f.t, f.from, f.to, f.clearance, _pose);
      g.position.set(pose.x, pose.y, pose.z);
      g.rotation.y = pose.ry;
      if (f.t > 0 && f.t < 1) carry(pose.x, pose.y, pose.z, pose.ry, m.type);
    }
    for (let i = hook; i < hoists.current.length; i++) {
      const h = hoists.current[i];
      if (h) h.visible = false;
    }

    // The stock capsule on the dock steps aside while its twin is on the hook.
    for (const type of ['base', 'extended'] as const) {
      let free = true;
      for (const f of flights.values()) {
        if (f.module.type !== type) continue;
        if ((f.from === DOCK[type] && f.t < 0.9) || (f.to === DOCK[type] && f.t > 0.2)) free = false;
      }
      stock[type] = free ? damp(stock[type], 1, 5, dt) : 0;
    }

    trucks.current.forEach((g, k) => {
      if (!g) return;
      if (!inJourney || k >= shipment.trucks) {
        g.visible = false;
        return;
      }
      yardTruck(k, p, shipment, _truck);
      g.visible = _truck.visible;
      g.position.set(_truck.x, -0.06, _truck.z);
    });
  });

  const slotY = (s: Slot) => s.level * MODULE_H + 0.05;
  // Dock labels would crowd the small viewport on phones.
  const dockLabel = () => (scroll.chapter === 'configure' && !director.compact && scroll.vh > 560 ? 1 : 0);

  return (
    <>
      <Floor y={-0.06} />
      <LightPool position={[-2, -0.03, 1]} radius={30} opacity={0.11} />
      <Built parts={pad} cast={false} />
      <lineSegments geometry={grid} material={L.grid} />
      <mesh
        geometry={hitGeometry}
        material={hitMaterial}
        scale={[12, 1, 9]}
        position={[0, 0.002, 0]}
        onClick={(e) => {
          if (interactive && inViewport(e) && e.delta < 6) select(null);
        }}
      />

      {/* Dock — the two standard capsules, always in stock. */}
      <Appear value={() => stock.base} rise={0} position={[DOCK.base.x, DOCK.base.y, DOCK.base.z]} rotation={[0, DOCK.base.ry, 0]}>
        <Capsule type="base" />
      </Appear>
      <Appear value={() => stock.extended} rise={0} position={[DOCK.extended.x, DOCK.extended.y, DOCK.extended.z]} rotation={[0, DOCK.extended.ry, 0]}>
        <Capsule type="extended" />
      </Appear>
      <Callout position={[DOCK.base.x, DOCK.base.y + HEIGHT + 0.3, DOCK.base.z]} label="3×3" sub="Base capsule" value={dockLabel} side="top" />
      <Callout position={[DOCK.extended.x, DOCK.extended.y + HEIGHT + 0.3, DOCK.extended.z]} label="3×6" sub="Extended capsule" value={dockLabel} side="top" />

      {list.map((m) => (
        <group
          key={m.id}
          ref={register(m.id)}
          position={worldCenter(m)}
          rotation={[0, rotationY(m.rot), 0]}
          onClick={(e) => {
            if (!interactive || !inViewport(e) || e.delta > 6) return;
            e.stopPropagation();
            select(m.id === selectedId ? null : m.id);
          }}
        >
          <Capsule type={m.type} mask={masks.get(m.id) ?? ALL_EXPOSED} />
          {m.id === selectedId && chapter === 'configure' && <CapsuleOutline type={m.type} tone="lime" scale={1.012} />}
        </group>
      ))}
      {departing.map((m) => (
        <group key={m.id} ref={register(m.id)} position={worldCenter(m)} rotation={[0, rotationY(m.rot), 0]}>
          <Capsule type={m.type} />
        </group>
      ))}

      {/* Connection points for the active tool, or for moving the selected module. */}
      {slots.map((s) => {
        const [x, , z] = worldCenter(s);
        return (
          <group key={`${s.key}:${s.rot}:${s.type}`} position={[x, slotY(s), z]}>
            <mesh geometry={ringGeometry} material={M.lime} />
            <Built parts={cross} owned={false} cast={false} receive={false} />
            <mesh
              geometry={hitGeometry}
              material={hitMaterial}
              onPointerOver={(e) => {
                if (!inViewport(e)) return;
                e.stopPropagation();
                setHoverSlot(s.key);
              }}
              onPointerOut={() => setHoverSlot(null)}
              onClick={(e) => {
                if (!inViewport(e) || e.delta > 6) return;
                e.stopPropagation();
                setHoverSlot(null);
                applySlot(s);
              }}
            />
          </group>
        );
      })}
      {hovered && (
        <group position={worldCenter(hovered)} rotation={[0, rotationY(hovered.rot), 0]}>
          <CapsuleOutline type={hovered.type} tone="lime" />
        </group>
      )}

      {[0, 1, 2].map((i) => (
        <group key={i} ref={(g) => void (hoists.current[i] = g)} visible={false}>
          <Hoist />
        </group>
      ))}

      {Array.from({ length: journey ? shipment.trucks : 0 }, (_, k) => (
        <group key={k} ref={(g) => void (trucks.current[k] = g)} visible={false}>
          <Truck />
        </group>
      ))}
    </>
  );
}
