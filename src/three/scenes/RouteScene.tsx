import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { exposureMask, worldCenter } from '../../lib/grid';
import { smooth } from '../../lib/math';
import { BAY, SITE, planShipment, siteModule, siteTruck, type ShipPose, type TruckPose } from '../../lib/shipping';
import { shippedModules, useConfig } from '../../state/config';
import { scroll } from '../../state/stage';
import { Appear } from '../core/Appear';
import { Builder, Built } from '../core/builder';
import { onScreen } from '../core/director';
import { SkyDome } from '../core/SkyDome';
import { Capsule } from '../objects/Capsule';
import { Floor, ScaleFigure, rand, treeParts } from '../objects/dressing';
import { MobileCrane, SPREADER_H, TRAILER, Truck, type CraneHandle } from '../objects/machines';
import { HEIGHT } from '../objects/shell';
import { deckParts, foundationParts, roofParts, shadeParts, stairParts } from '../objects/siteKit';
import { ROAD, leadX, onRoad, siteV } from './route.def';

const CRANE: [number, number, number] = [-15.5, 0, 2.5];

function buildRoad() {
  const b = new Builder();
  b.box('asphalt', 640, 0.04, 9, 0, 0.02, 0);
  b.box('gravel', 640, 0.03, 1.6, 0, 0.015, 5.3).box('gravel', 640, 0.03, 1.6, 0, 0.015, -5.3);
  b.box('ivory', 640, 0.01, 0.12, 0, 0.046, 4.1).box('ivory', 640, 0.01, 0.12, 0, 0.046, -4.1);
  for (let x = -316; x < 320; x += 9) b.box('ivory', 3.2, 0.01, 0.12, x, 0.046, 0);
  return b.build();
}

function buildRoadside() {
  const trees: [number, number, number][] = [];
  let i = 0;
  for (let x = -300; x < 300; x += 7.5) {
    for (const side of [-1, 1]) {
      i++;
      if (rand(i) < 0.55) continue;
      trees.push([x + rand(i + 0.5) * 6, side * (17 + rand(i * 3) * 44), 0.7 + rand(i * 7) * 0.7]);
    }
  }
  return treeParts(trees);
}

function buildHills(z0: number) {
  const b = new Builder();
  for (let i = 0; i < 9; i++) {
    const r = 60 + rand(i * 5 + z0) * 70;
    b.sphere('grass', r, -360 + i * 90 + rand(i + z0) * 30, -r * 0.72, z0 - rand(i * 2 + z0) * 80, 1, 20);
  }
  return b.build();
}

function buildSite() {
  const b = new Builder();
  b.box('gravel', 34, 0.05, 25, -2, 0.025, 1.5);
  b.box('asphalt', 260, 0.04, 5.4, 0, 0.03, BAY.z);
  const trees: [number, number, number][] = [];
  for (let i = 0; i < 46; i++) {
    const x = -80 + rand(i * 11) * 160;
    const z = -26 - rand(i * 13) * 60;
    trees.push([x, z, 0.75 + rand(i * 17) * 0.8]);
  }
  for (let i = 0; i < 6; i++) trees.push([34 + rand(i) * 36, -22 + rand(i * 3) * 14, 0.7 + rand(i * 5) * 0.6]);
  return { ground: b.build(), trees: treeParts(trees) };
}

const _ship: ShipPose = { x: 0, y: 0, z: 0, ry: 0, lift: -1 };
const _truck: TruckPose = { x: 0, z: 0, visible: false };

/** Transport and installation of the visitor's configuration. */
export default function RouteScene() {
  const modules = useConfig((s) => s.modules);
  const list = useMemo(() => shippedModules(modules), [modules]);
  const shipment = useMemo(() => planShipment(list), [list]);
  /** Remount key for geometry derived from the configuration. */
  const signature = useMemo(() => list.map((m) => `${m.type}${m.x}.${m.z}.${m.rot}.${m.level}`).join('|'), [list]);
  const masks = useMemo(() => shipment.order.map((m) => exposureMask(m, list)), [shipment, list]);
  const centre = useMemo(() => {
    let x = 0;
    let z = 0;
    for (const m of list) {
      const c = worldCenter(m);
      x += c[0] / list.length;
      z += c[2] / list.length;
    }
    return [x, z] as const;
  }, [list]);

  const road = useMemo(buildRoad, []);
  const roadside = useMemo(buildRoadside, []);
  const hills = useMemo(() => buildHills(-190), []);
  const site = useMemo(buildSite, []);
  const kit = useMemo(
    () => ({
      foundation: foundationParts(list),
      deck: deckParts(list),
      stairs: stairParts(list),
      shades: shadeParts(list),
      roof: roofParts(list),
    }),
    [list],
  );

  const roadGroup = useRef<Group>(null);
  const siteGroup = useRef<Group>(null);
  const convoy = useRef<(Group | null)[]>([]);
  const siteTrucks = useRef<(Group | null)[]>([]);
  const siteModules = useRef<(Group | null)[]>([]);
  const crane = useRef<CraneHandle>(null);
  const v = useMemo(() => ({ deck: 0, stairs: 0, shades: 0, roof: 0, life: 0 }), []);

  useFrame(() => {
    if (!onScreen('route')) return;
    const p = scroll.p.journey;
    const road = onRoad(p);
    if (roadGroup.current) roadGroup.current.visible = road;
    if (siteGroup.current) siteGroup.current.visible = !road;

    if (road) {
      const x = leadX(p);
      convoy.current.forEach((g, k) => g?.position.set(x - k * ROAD.spacing, 0, k % 2 === 0 ? 2 : 2.1));
      return;
    }

    const t = siteV(p);
    siteTrucks.current.forEach((g, k) => {
      if (!g) return;
      siteTruck(k, p, shipment, _truck);
      g.visible = _truck.visible;
      g.position.set(_truck.x, 0, _truck.z);
    });

    let lifted = false;
    shipment.order.forEach((m, i) => {
      const g = siteModules.current[i];
      if (!g) return;
      siteModule(i, p, shipment, _ship);
      g.position.set(_ship.x, _ship.y, _ship.z);
      g.rotation.y = _ship.ry;
      if (_ship.lift >= 0 && !lifted) {
        lifted = true;
        crane.current?.reach(_ship.x, _ship.y + HEIGHT + SPREADER_H, _ship.z, _ship.ry, m.type === 'base' ? 1 : 2.5);
      }
    });
    if (!lifted) crane.current?.reach(centre[0] - 3, 10, centre[1] + 6, 0, 2.5, false);

    v.deck = smooth(t, SITE.deck[0], SITE.deck[1]);
    v.stairs = smooth(t, SITE.stairs[0], SITE.stairs[1]);
    v.shades = smooth(t, SITE.shades[0], SITE.shades[1]);
    v.roof = smooth(t, SITE.roof[0], SITE.roof[1]);
    v.life = smooth(t, 0.95, 1);
  });

  return (
    <>
      <SkyDome top="#0c1c28" horizon="#33495a" glow="#d4976a" glowDir={[-1, 0, -0.5]} glowSize={0.55} />
      <Floor mat="grass" radius={520} y={-0.02} />

      <group ref={roadGroup}>
        <Built parts={road} cast={false} />
        <Built parts={roadside} />
        <Built parts={hills} cast={false} />
        {Array.from({ length: shipment.trucks }, (_, k) => (
          <group key={k} ref={(g) => void (convoy.current[k] = g)}>
            <Truck />
            {shipment.order.map((m, i) =>
              shipment.truck[i] === k ? (
                <group key={m.id} position={[shipment.slotX[i], TRAILER.deckY, 0]}>
                  <Capsule type={m.type} mask={masks[i]} />
                </group>
              ) : null,
            )}
          </group>
        ))}
      </group>

      <group ref={siteGroup} visible={false}>
        <Built parts={site.ground} cast={false} />
        <Built parts={site.trees} />
        <Built parts={hills} owned={false} cast={false} />
        <Built parts={kit.foundation} />
        <MobileCrane ref={crane} position={CRANE} />
        <ScaleFigure position={[CRANE[0] + 5, 0.05, CRANE[2] + 5.5]} rotation={0.75} />

        {Array.from({ length: shipment.trucks }, (_, k) => (
          <group key={k} ref={(g) => void (siteTrucks.current[k] = g)}>
            <Truck />
          </group>
        ))}
        {shipment.order.map((m, i) => (
          <group key={m.id} ref={(g) => void (siteModules.current[i] = g)}>
            <Capsule type={m.type} mask={masks[i]} />
          </group>
        ))}

        <group key={signature}>
          <Appear value={() => v.deck}>
            <Built parts={kit.deck} />
          </Appear>
          <Appear value={() => v.stairs}>
            <Built parts={kit.stairs} />
          </Appear>
          <Appear value={() => v.shades}>
            <Built parts={kit.shades} />
          </Appear>
          <Appear value={() => v.roof} rise={0.8}>
            <Built parts={kit.roof} />
          </Appear>
        </group>
      </group>
    </>
  );
}
