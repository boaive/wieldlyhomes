import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { liftPose } from '../../lib/shipping';
import { worldCenter, type PlacedModule } from '../../lib/grid';
import { clamp, lerp, smooth } from '../../lib/math';
import type { Pose3 } from '../../state/config';
import { scroll } from '../../state/stage';
import { Appear } from '../core/Appear';
import { Builder, Built } from '../core/builder';
import { onScreen } from '../core/director';
import { Floor, LightPool, ScaleFigure } from '../objects/dressing';
import { HeroModule, heroState } from '../objects/HeroModule';
import { Hoist } from '../objects/machines';
import { HEIGHT } from '../objects/shell';
import { PIER_H, deckParts, roofParts, shadeParts, stairParts } from '../objects/siteKit';
import { STORY_LAYOUT, installFlight, storyLocal } from './story.def';

const { bedX: B, bedTop, siteY } = STORY_LAYOUT;
const SITE_MODULE: PlacedModule = { id: 'story', type: 'extended', x: 2, z: 2, rot: 0, level: 0 };

function buildSite() {
  const pad = new Builder();
  pad.box('earth', 11, 0.05, 8.6, 0, 0.025, 0.9);
  pad.box('gravel', 8, 0.03, 4.8, 0, 0.06, 0);

  const footing = new Builder();
  const piers = new Builder();
  const plinth = new Builder();
  for (const x of [-3, 0, 3]) {
    for (const z of [-1.5, 1.5]) {
      footing.box('concreteDark', 0.95, 0.18, 0.95, x, 0.15, z);
      piers.box('concrete', 0.38, PIER_H - 0.44, 0.38, x, 0.24 + (PIER_H - 0.44) / 2, z);
    }
  }
  for (const z of [-1.5, 1.5]) plinth.box('concreteDark', 6.3, 0.22, 0.28, 0, PIER_H - 0.11, z);
  for (const x of [-3, 0, 3]) plinth.box('concreteDark', 0.28, 0.22, 3, x, PIER_H - 0.11, 0);
  return { pad: pad.build(), footing: footing.build(), piers: piers.build(), plinth: plinth.build() };
}

function buildBed() {
  const b = new Builder();
  b.box('slab', 12, 0.25, 7.6, B, 0.125, 0);
  b.box('ivory', 12, 0.012, 0.08, B, 0.256, 3.6).box('ivory', 12, 0.012, 0.08, B, 0.256, -3.6);
  b.box('ivory', 0.08, 0.012, 7.2, B - 5.96, 0.256, 0).box('ivory', 0.08, 0.012, 7.2, B + 5.96, 0.256, 0);
  for (const x of [-2.2, 0, 2.2]) b.box('steel', 0.25, bedTop - 0.25, 3.4, B + x, 0.25 + (bedTop - 0.25) / 2, 0);
  return b.build();
}

/** Concrete mixer and placing boom for stage 06. */
function buildCasting() {
  const b = new Builder();
  const mx = B - 9.5;
  const mz = -6;
  b.box('steel', 7.4, 0.4, 1.1, mx, 0.9, mz);
  b.box('ivory', 2.0, 2.1, 2.4, mx + 2.9, 2.0, mz);
  b.box('glassDark', 0.06, 0.8, 2.1, mx + 3.92, 2.45, mz);
  b.cyl('ivory', 1.2, 3.8, mx - 0.9, 2.45, mz, 0, 0, Math.PI / 2 - 0.22, 24, 0.62);
  b.cyl('steelMid', 1.22, 0.3, mx - 0.6, 2.38, mz, 0, 0, Math.PI / 2 - 0.22, 24, 1.18);
  b.box('steel', 0.7, 0.6, 0.9, mx - 3.3, 2.2, mz);
  for (const x of [2.6, -1.4, -2.7]) {
    for (const z of [-1.08, 1.08]) b.cyl('rubber', 0.52, 0.34, mx + x, 0.52, mz + z, Math.PI / 2, 0, 0, 20);
  }

  // Placing boom reaching over the form.
  const px = B - 4.6;
  const pz = -6.4;
  b.box('steel', 2.4, 0.5, 2.4, px, 0.25, pz);
  b.cyl('steelMid', 0.3, 1.6, px, 1.3, pz, 0, 0, 0, 16);
  const pts: [number, number, number][] = [
    [px, 2.0, pz],
    [px + 0.6, 8.6, pz + 1.6],
    [B + 0.9, 9.4, -1.6],
    [B - 0.4, 5.2, -0.3],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    b.beam('ivory', 0.3 - i * 0.05, ...pts[i], ...pts[i + 1]);
    b.sphere('steel', 0.24 - i * 0.03, ...pts[i + 1]);
  }
  b.cyl('rubber', 0.07, 1.5, B - 0.4, 4.45, -0.3, 0, 0, 0, 10);
  return b.build();
}

export default function StoryScene() {
  const moduleRef = useRef<Group>(null);
  const hoistRef = useRef<Group>(null);
  const hero = useMemo(() => heroState({ frame: 0, insulation: 0, services: 0, skin: 0, pour: 0, lining: 0, finish: 0, furniture: 0 }), []);
  const v = useMemo(
    () => ({ footing: 0, piers: 0, plinth: 0, casting: 0, hoist: 0, deck: 0, stairs: 0, shades: 0, roof: 0, life: 0 }),
    [],
  );
  const site = useMemo(buildSite, []);
  const bed = useMemo(buildBed, []);
  const casting = useMemo(buildCasting, []);
  const kit = useMemo(() => {
    const modules = [SITE_MODULE];
    const b = new Builder();
    // Two chairs and a low table on the finished deck.
    for (const x of [-0.55, 0.55]) {
      b.box('timberDark', 0.55, 0.06, 0.55, x, 0.4, 0);
      b.box('timberDark', 0.55, 0.5, 0.06, x, 0.66, -0.26);
      for (const [dx, dz] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) b.box('steel', 0.04, 0.4, 0.04, x + dx, 0.2, dz);
    }
    return { deck: deckParts(modules), stairs: stairParts(modules), shades: shadeParts(modules), roof: roofParts(modules), chairs: b.build() };
  }, []);
  const kitOffset = useMemo<[number, number, number]>(() => {
    const [x, , z] = worldCenter(SITE_MODULE);
    return [-x, 0, -z];
  }, []);

  const poses = useMemo(
    () => ({
      bed: { x: B, y: bedTop, z: 0, ry: 0 } as Pose3,
      site: { x: 0, y: siteY, z: 0, ry: 0 } as Pose3,
      now: { x: B, y: bedTop, z: 0, ry: 0 } as Pose3,
    }),
    [],
  );

  useFrame(() => {
    if (!onScreen('story')) return;
    const p = scroll.p.story;
    const u = (i: number) => storyLocal(p, i);

    v.footing = smooth(u(0), 0.02, 0.26);
    v.piers = smooth(u(0), 0.24, 0.5);
    v.plinth = smooth(u(0), 0.46, 0.72);

    hero.frame = smooth(u(1), 0.1, 0.62);
    hero.insulation = smooth(u(2), 0.1, 0.62);
    hero.services = smooth(u(3), 0.1, 0.62);
    const strip = 1 - smooth(u(5), 0.8, 0.98);
    const xray = lerp(1, 0.34, smooth(u(5), 0.04, 0.2)) * strip;
    hero.formwork = smooth(u(4), 0.08, 0.42) * xray;
    hero.formFront = smooth(u(4), 0.36, 0.72) * xray;
    hero.skin = smooth(u(5), 0.06, 0.14);
    hero.pour = clamp((u(5) - 0.12) / 0.62);
    v.casting = smooth(u(5), -0.05, 0.1) * (1 - smooth(u(5), 0.86, 1.02));
    hero.lining = smooth(u(6), 0, 0.26);
    hero.finish = smooth(u(6), 0.2, 0.56);
    hero.furniture = smooth(u(6), 0.5, 0.9);

    const t = installFlight(p);
    liftPose(t, poses.bed, poses.site, 5.4, poses.now);
    moduleRef.current?.position.set(poses.now.x, poses.now.y, poses.now.z);
    hoistRef.current?.position.set(poses.now.x, poses.now.y + HEIGHT, poses.now.z);
    v.hoist = smooth(u(7), -0.02, 0.05) * (1 - smooth(u(7), 0.61, 0.69));
    v.deck = smooth(u(7), 0.64, 0.74);
    v.stairs = smooth(u(7), 0.72, 0.82);
    v.shades = smooth(u(7), 0.8, 0.9);
    v.roof = smooth(u(7), 0.88, 0.97);
    v.life = smooth(u(8), 0.05, 0.3);
  });

  return (
    <>
      <Floor grid={0} />
      <LightPool position={[B, 0.03, 0]} radius={18} opacity={0.12} />
      <LightPool position={[0, 0.08, 0.5]} radius={16} opacity={0.1} />
      <Built parts={site.pad} cast={false} />
      <Built parts={bed} />

      <Appear value={() => v.footing}>
        <Built parts={site.footing} />
      </Appear>
      <Appear value={() => v.piers}>
        <Built parts={site.piers} />
      </Appear>
      <Appear value={() => v.plinth}>
        <Built parts={site.plinth} />
      </Appear>

      <Appear value={() => v.casting} rise={0}>
        <Built parts={casting} />
      </Appear>

      <group ref={moduleRef} position={[B, bedTop, 0]}>
        <HeroModule state={hero} />
      </group>
      <group ref={hoistRef}>
        <Appear value={() => v.hoist} rise={0}>
          <Hoist />
        </Appear>
      </group>

      <group position={kitOffset}>
        <Appear value={() => v.deck}>
          <Built parts={kit.deck} />
        </Appear>
        <Appear value={() => v.stairs}>
          <Built parts={kit.stairs} />
        </Appear>
        <Appear value={() => v.shades}>
          <Built parts={kit.shades} />
        </Appear>
        <Appear value={() => v.roof}>
          <Built parts={kit.roof} />
        </Appear>
      </group>

      <Appear value={() => v.life} rise={0}>
        <group position={[1.2, PIER_H + 0.2, 2.75]}>
          <Built parts={kit.chairs} />
        </group>
        <ScaleFigure position={[-1.4, PIER_H + 0.2, 2.9]} rotation={0.8} />
      </Appear>
    </>
  );
}
