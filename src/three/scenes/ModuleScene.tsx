import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { ALL_EXPOSED, FACE, worldCenter, type PlacedModule } from '../../lib/grid';
import { lerp, smooth } from '../../lib/math';
import { scroll } from '../../state/stage';
import { Appear } from '../core/Appear';
import { Builder, Built } from '../core/builder';
import { Callout } from '../core/Callout';
import { onScreen } from '../core/director';
import { Capsule } from '../objects/Capsule';
import { DimLine, Floor, LightPool } from '../objects/dressing';
import { HeroModule, heroState } from '../objects/HeroModule';
import { Hoist } from '../objects/machines';
import { HEIGHT } from '../objects/shell';
import { PIER_H, deckParts, foundationParts, stairParts } from '../objects/siteKit';
import { whyLocal, whyWindow } from './module.def';

const BEARER = 0.35;
const SITE_MODULE: PlacedModule = { id: 'why', type: 'extended', x: 2, z: 2, rot: 0, level: 0 };

/** Why Wieldy — one module, six demonstrations. */
export default function ModuleScene() {
  const root = useRef<Group>(null);
  const neighbour = useRef<Group>(null);
  const hero = useMemo(() => heroState(), []);
  const v = useMemo(() => ({ dims: 0, insulated: 0, modular: 0, lift: 0, stack: [0, 0, 0, 0], site: 0, deck: 0, stairs: 0, scalable: 0 }), []);

  const bearers = useMemo(() => {
    const b = new Builder();
    for (const x of [-2.2, 0, 2.2]) b.box('steel', 0.25, BEARER, 3.4, x, BEARER / 2, 0);
    return b.build();
  }, []);

  const kit = useMemo(() => {
    const modules = [SITE_MODULE];
    const b = new Builder();
    b.box('gravel', 12, 0.04, 9.5, -1.5, 0.02, 0.9);
    return { foundation: foundationParts(modules), deck: deckParts(modules), stairs: stairParts(modules), pad: b.build() };
  }, []);
  const kitOffset = useMemo<[number, number, number]>(() => {
    const [x, , z] = worldCenter(SITE_MODULE);
    return [-x, 0, -z];
  }, []);

  useFrame(() => {
    if (!onScreen('module')) return;
    const p = scroll.p.why;
    v.dims = whyWindow(p, 0);
    v.insulated = whyWindow(p, 1);
    v.modular = whyWindow(p, 2);
    v.lift = whyWindow(p, 3, 0.22);
    v.scalable = whyWindow(p, 4);
    const u4 = whyLocal(p, 4);
    const out4 = 1 - smooth(u4, 0.88, 1);
    for (let j = 0; j < 4; j++) v.stack[j] = smooth(u4, 0.06 + j * 0.13, 0.2 + j * 0.13) * out4;
    const u5 = whyLocal(p, 5);
    v.site = smooth(u5, 0.02, 0.22);
    v.deck = smooth(u5, 0.26, 0.44);
    v.stairs = smooth(u5, 0.4, 0.58);

    hero.skin = 1 - 0.86 * v.insulated;
    if (root.current) root.current.position.y = lerp(BEARER, PIER_H, v.site) + 1.8 * v.lift;
    if (neighbour.current) neighbour.current.position.x = lerp(10.5, 4.5, smooth(whyLocal(p, 2), 0.1, 0.48));
  });

  return (
    <>
      <Floor grid={30} />
      <LightPool radius={17} opacity={0.13} />

      <Appear value={() => 1 - v.site} rise={0}>
        <Built parts={bearers} />
      </Appear>

      <group ref={root} position={[0, BEARER, 0]}>
        <HeroModule state={hero} />
        <Appear value={() => v.lift} rise={0} position={[0, HEIGHT, 0]}>
          <Hoist />
        </Appear>
        <Callout position={[-3, HEIGHT + 0.2, 1.5]} label="½×" sub="Weight of precast concrete" value={() => v.lift} side="left" />
        <Callout position={[-3, 2.4, 1.52]} label="Insulated core" sub="Aerogel · PIR · Glass wool" value={() => v.insulated} side="left" />
      </group>

      {/* 01 Controlled — the module, dimensioned. */}
      <Appear value={() => v.dims} rise={0}>
        <DimLine from={[-3, 0.03, 2.5]} to={[3, 0.03, 2.5]} tick={[0, 0, 0.22]} />
        <DimLine from={[3.9, 0.03, -1.5]} to={[3.9, 0.03, 1.5]} tick={[0.22, 0, 0]} />
        <DimLine from={[3.9, BEARER, 1.9]} to={[3.9, BEARER + HEIGHT, 1.9]} tick={[0.22, 0, 0]} />
      </Appear>
      <Callout position={[0, 0.03, 2.5]} label="6 000" sub="mm" value={() => v.dims} side="top" />
      <Callout position={[3.9, 0.03, 0]} label="3 000" sub="mm" value={() => v.dims} />
      <Callout position={[3.9, BEARER + HEIGHT / 2, 1.9]} label="3 000" sub="mm" value={() => v.dims} />

      {/* 03 Modular — a base capsule connects to the extended capsule. */}
      <Appear value={() => v.modular} rise={0}>
        <group ref={neighbour} position={[10.5, BEARER, 0]}>
          <Capsule type="base" mask={ALL_EXPOSED & ~FACE.L} />
        </group>
      </Appear>
      <Callout position={[3, BEARER + HEIGHT + 0.25, 1.5]} label="3×6 + 3×3" sub="One connection" value={() => v.modular} side="top" />

      {/* 05 Scalable — the same capsule, stacked to five storeys. */}
      {[1, 2, 3, 4].map((level) => (
        <Appear key={level} value={() => v.stack[level - 1]} rise={1.6} position={[0, BEARER + level * HEIGHT, 0]}>
          <Capsule type="extended" />
        </Appear>
      ))}
      <Callout position={[3, BEARER + HEIGHT * 5, 1.5]} label="05" sub="Storeys" value={() => v.stack[3]} />

      {/* 06 Site-ready — piers, deck and stairs. */}
      <group position={kitOffset}>
        <Appear value={() => v.site} rise={0}>
          <Built parts={kit.pad} cast={false} />
          <Built parts={kit.foundation} />
        </Appear>
        <Appear value={() => v.deck}>
          <Built parts={kit.deck} />
        </Appear>
        <Appear value={() => v.stairs}>
          <Built parts={kit.stairs} />
        </Appear>
      </group>
      <Callout position={[-3, PIER_H + HEIGHT + 0.2, 1.5]} label="30–60%" sub="Faster build" value={() => v.deck} side="left" />
    </>
  );
}
