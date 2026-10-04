import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { factoryAssets } from '../../config/assets';
import { REVEAL } from '../../content/timeline';
import { windowed } from '../../lib/math';
import { scroll } from '../../state/stage';
import { Builder, Built } from '../core/builder';
import { Callout } from '../core/Callout';
import { onScreen } from '../core/director';
import { ModelSlot } from '../core/ModelSlot';
import { SkyDome } from '../core/SkyDome';
import { TextPlane } from '../core/text';
import { Capsule, CapsuleOutline } from '../objects/Capsule';
import { Floor, LightPool, ScaleFigure } from '../objects/dressing';
import { HeroModule, heroState } from '../objects/HeroModule';
import { Truck, TRAILER } from '../objects/machines';
import { FACTORY, revealCut } from './factory.def';

const { halfW: HW, depth: D, height: H, door, stationX: SX, stationZ, bearer } = FACTORY;

/** Facility shell and yard — the opening shot. */
function buildExterior() {
  const b = new Builder();
  const T = 0.4;
  const side = (HW * 2 - door.w) / 2;

  // Envelope
  b.box('cladding', side, H, T, -(door.w / 2 + side / 2), H / 2, 0);
  b.box('cladding', side, H, T, door.w / 2 + side / 2, H / 2, 0);
  b.box('cladding', door.w, H - door.h, T, 0, door.h + (H - door.h) / 2, 0);
  b.box('cladding', T, H, D, -HW - T / 2, H / 2, -D / 2);
  b.box('cladding', T, H, D, HW + T / 2, H / 2, -D / 2);
  b.box('cladding', HW * 2, H, T, 0, H / 2, -D);
  b.box('cladding', HW * 2 + 1.4, 0.5, D + 1.4, 0, H + 0.25, -D / 2);

  // Vertical ribs give the cladding its rhythm.
  for (let x = -HW + 0.75; x < HW; x += 1.5) {
    if (Math.abs(x) < door.w / 2 + 0.6) continue;
    b.box('steel', 0.14, H - 2.4, 0.16, x, (H - 2.4) / 2, T / 2 + 0.06);
  }
  // Clerestory band and door portal.
  b.box('windowGlow', HW * 2 - 2, 0.42, 0.08, 0, H - 1.5, T / 2 + 0.02);
  b.box('galv', 0.3, door.h + 0.3, 0.7, -door.w / 2 - 0.15, (door.h + 0.3) / 2, 0.1);
  b.box('galv', 0.3, door.h + 0.3, 0.7, door.w / 2 + 0.15, (door.h + 0.3) / 2, 0.1);
  b.box('galv', door.w + 0.6, 0.3, 0.7, 0, door.h + 0.15, 0.1);
  b.box('steel', door.w + 3, 0.22, 4.4, 0, door.h + 0.75, 2.2);

  // Apron and guide lines.
  b.box('slab', 260, 0.05, 260, 0, 0.025, 130);
  for (const x of [-door.w / 2, door.w / 2]) b.box('marking', 0.1, 0.01, 46, x, 0.056, 23);
  for (let z = 6; z < 46; z += 6) b.box('marking', 0.1, 0.01, 2.4, 0, 0.056, z);
  b.box('marking', 30, 0.01, 0.1, 22, 0.056, 9).box('marking', 30, 0.01, 0.1, 22, 0.056, 31);

  // Yard lighting and staging bearers.
  for (const x of [-29, 33]) {
    b.cyl('galv', 0.1, 9.5, x, 4.75, 36, 0, 0, 0, 10);
    b.box('galv', 1.6, 0.08, 0.3, x - Math.sign(x) * 0.7, 9.5, 36);
    b.box('coolGlow', 1.1, 0.04, 0.24, x - Math.sign(x) * 0.8, 9.44, 36);
  }
  for (const dz of [-2.2, 0, 2.2]) b.box('steel', 3.4, bearer, 0.25, 15, bearer / 2, 14 + dz);
  for (const dz of [-1.1, 1.1]) b.box('steel', 3.4, bearer, 0.25, 15, bearer / 2, 22 + dz);
  return b.build();
}

/** Production hall: structure, lighting, crane and floor markings. */
function buildHall() {
  const b = new Builder();

  b.box('slab', HW * 2, 0.06, D, 0, 0.03, -D / 2);
  b.box('cladding', 0.1, H - 0.4, D - 1, -HW + 0.05, H / 2, -D / 2);
  b.box('cladding', 0.1, H - 0.4, D - 1, HW - 0.05, H / 2, -D / 2);
  b.box('cladding', HW * 2, H - 0.4, 0.1, 0, H / 2, -D + 0.3);
  // A low concrete dado keeps the dark walls from reading as a void.
  b.box('concreteDark', 0.14, 1.2, D - 1, -HW + 0.12, 0.6, -D / 2);
  b.box('concreteDark', 0.14, 1.2, D - 1, HW - 0.12, 0.6, -D / 2);

  for (let z = -4; z > -D; z -= 8) {
    for (const x of [-HW + 1.2, HW - 1.2]) b.box('steelMid', 0.5, H - 0.4, 0.5, x, (H - 0.4) / 2, z);
    // Roof truss
    b.box('steel', HW * 2 - 2, 0.26, 0.26, 0, 11.3, z);
    b.box('steel', HW * 2 - 2, 0.26, 0.26, 0, 12.6, z);
    for (let x = -HW + 3; x < HW - 2; x += 4) {
      b.beam('steel', 0.14, x, 11.3, z, x + 2, 12.6, z);
      b.beam('steel', 0.14, x + 2, 12.6, z, x + 4, 11.3, z);
    }
    // Linear luminaires
    for (const x of [-13, -3, 7, 16]) {
      b.box('coolGlow', 0.22, 0.06, 5.2, x, 10.7, z - 4);
      b.box('steel', 0.3, 0.08, 5.4, x, 10.78, z - 4);
    }
  }

  // Overhead crane: rails, twin girders and trolley parked above the last bay.
  for (const x of [-HW + 2.2, HW - 2.2]) b.box('steel', 0.5, 0.7, D - 2, x, 9.2, -D / 2);
  for (const dz of [-0.9, 0.9]) b.box('steelMid', HW * 2 - 4, 1.1, 0.7, 0, 10.1, stationZ[4] + 7 + dz);
  b.box('ivory', 2.4, 0.8, 2.4, SX, 10.7, stationZ[4] + 7);
  b.cyl('galv', 0.03, 2.4, SX - 0.5, 8.5, stationZ[4] + 7, 0, 0, 0, 6);
  b.cyl('galv', 0.03, 2.4, SX + 0.5, 8.5, stationZ[4] + 7, 0, 0, 0, 6);
  b.box('steel', 1.6, 0.5, 0.5, SX, 7.1, stationZ[4] + 7);

  // Aisle and bay markings.
  for (const x of [0.6, 9.4]) b.box('marking', 0.07, 0.01, D - 6, x, 0.066, -D / 2);
  for (const z of stationZ) {
    const w = 12;
    const d = 9;
    b.box('marking', w, 0.01, 0.05, SX, 0.066, z - d / 2).box('marking', w, 0.01, 0.05, SX, 0.066, z + d / 2);
    b.box('marking', 0.05, 0.01, d, SX - w / 2, 0.066, z).box('marking', 0.05, 0.01, d, SX + w / 2, 0.066, z);
  }

  // Bearers under each station module, and under the finished stock on the right.
  for (const z of stationZ.slice(2)) {
    for (const dx of [-2.2, 0, 2.2]) b.box('steel', 0.25, bearer, 3.4, SX + dx, bearer / 2, z);
  }
  for (let i = 0; i < 5; i++) {
    for (const dz of [-2.2, 0, 2.2]) b.box('steel', 3.4, bearer, 0.25, 15.5, bearer / 2, -14 - i * 14 + dz);
  }

  // 01 Design — plan table.
  const z1 = stationZ[0];
  b.box('ivory', 3.4, 0.06, 1.7, SX + 3.2, 0.95, z1 + 3);
  for (const [dx, dz] of [[-1.5, -0.7], [1.5, -0.7], [-1.5, 0.7], [1.5, 0.7]]) {
    b.box('steel', 0.06, 0.92, 0.06, SX + 3.2 + dx, 0.46, z1 + 3 + dz);
  }
  b.box('concreteLight', 2.2, 0.01, 1.2, SX + 3.0, 0.986, z1 + 3);
  b.box('steel', 1.6, 0.004, 0.012, SX + 3.0, 0.994, z1 + 2.75).box('steel', 1.6, 0.004, 0.012, SX + 3.0, 0.994, z1 + 3.25);
  b.box('steel', 0.012, 0.004, 0.5, SX + 2.2, 0.994, z1 + 3).box('steel', 0.012, 0.004, 0.5, SX + 3.8, 0.994, z1 + 3);
  b.box('steel', 0.012, 0.004, 0.5, SX + 3.0, 0.994, z1 + 3);

  // 02 Planning — base jigs set out on the grid.
  const z2 = stationZ[1];
  for (const [ox, oz, w] of [[-1.5, -1.5, 6], [0, 1.5, 3]] as const) {
    b.box('steel', w, 0.16, 0.14, SX + ox, 0.14, z2 + oz - 1.4).box('steel', w, 0.16, 0.14, SX + ox, 0.14, z2 + oz + 1.4);
    for (let x = -w / 2; x <= w / 2 + 0.01; x += 1.5) b.box('steel', 0.14, 0.16, 2.94, SX + ox + x, 0.14, z2 + oz);
  }
  return b.build();
}

const LAYER_POINTS: [number, number, number][] = [
  [1.69, 2.95, 1.39],
  [-0.56, 2.9, 0.2],
  [1.25, 2.3, -1.3],
  [0.74, 0.8, 0.2],
];
const LAYER_NAMES = ['Structure', 'Insulation', 'Services', 'Interior'];

export default function FactoryScene() {
  const exterior = useMemo(buildExterior, []);
  const hall = useMemo(buildHall, []);

  const states = useMemo(
    () => ({
      engineering: heroState({ insulation: 0, services: 0, skin: 0, pour: 0, lining: 0, finish: 0, furniture: 0 }),
      manufacturing: heroState({ formwork: 1, pour: 0.62, lining: 0, finish: 0, furniture: 0 }),
      finished: heroState(),
    }),
    [],
  );

  useFrame(() => {
    if (!onScreen('factory')) return;
    states.finished.cut = scroll.chapter === 'reveal' ? revealCut(scroll.p.reveal) : 0;
  });

  const layerValue = (i: number) => () => {
    if (scroll.chapter !== 'reveal') return 0;
    const span = (REVEAL.layers.end - REVEAL.layers.start) / REVEAL.layers.count;
    const a = REVEAL.layers.start + i * span;
    return windowed(scroll.p.reveal, a, a + 0.03, a + span - 0.03, a + span);
  };

  const [z1, z2, z3, z4, z5] = stationZ;

  return (
    <>
      <SkyDome top="#070f16" horizon="#1a2b37" glow="#a8704c" glowDir={[-0.5, 0, -1]} glowSize={0.5} />
      <Floor mat="asphalt" radius={320} />

      <ModelSlot src={factoryAssets.exterior}>
        <Built parts={exterior} cast={false} />
        <TextPlane text="WIELDY HOMES" height={0.8} position={[9.6, 8.6, 0.32]} tracking={0.32} left />
        <TextPlane text="MODULAR PRECAST" height={0.26} position={[9.7, 7.7, 0.32]} tracking={0.4} font='500 "IBM Plex Mono", monospace' opacity={0.7} left />
      </ModelSlot>

      {/* Finished capsules staged in the yard, and one already loaded for dispatch. */}
      <group position={[15, bearer, 14]} rotation={[0, Math.PI / 2, 0]}>
        <Capsule type="extended" />
      </group>
      <group position={[15, bearer, 22]} rotation={[0, Math.PI / 2, 0]}>
        <Capsule type="base" />
      </group>
      <group position={[27, 0, 20]} rotation={[0, Math.PI / 2 - 0.06, 0]}>
        <Truck />
        <group position={[TRAILER.backX + 3.2, TRAILER.deckY, 0]}>
          <Capsule type="extended" />
        </group>
      </group>
      <LightPool position={[0, 0.07, 6]} radius={13} color="#ffcf9a" opacity={0.13} />

      <ModelSlot src={factoryAssets.interior}>
        <Built parts={hall} cast={false} />

        {stationZ.map((z, i) => (
          <TextPlane
            key={z}
            text={`0${i + 1}`}
            height={0.55}
            position={[SX + 4.9, 0.08, z + 3.6]}
            floor={Math.PI / 2}
            font='500 "IBM Plex Mono", monospace'
            tracking={0.08}
            color="#c9cdc8"
            opacity={0.7}
          />
        ))}
        {stationZ.map((z) => (
          <LightPool key={z} position={[SX, 0.075, z]} radius={11} opacity={0.16} />
        ))}

        {/* 01 Design — the module as a drawing. */}
        <group position={[SX - 1, 0, z1 - 0.5]}>
          <CapsuleOutline type="extended" />
          <group position={[0, 0, 0]} scale={[0.5, 1, 1]}>
            <CapsuleOutline type="extended" tone="ivoryDim" />
          </group>
        </group>
        <ScaleFigure position={[SX + 3.2, 0.06, z1 + 4.2]} rotation={1.0} />

        {/* 02 Planning — volumes set out over their jigs. */}
        <group position={[SX - 1.5, 0.22, z2 - 1.5]}>
          <CapsuleOutline type="extended" tone="ivoryDim" />
        </group>
        <group position={[SX, 0.22, z2 + 1.5]}>
          <CapsuleOutline type="base" tone="ivoryDim" />
        </group>

        {/* 03 Engineering · 04 Manufacturing · 05 Construction */}
        <HeroModule state={states.engineering} position={[SX, bearer, z3]} />
        <HeroModule state={states.manufacturing} position={[SX, bearer, z4]} />
        <ScaleFigure position={[SX + 4.3, 0.06, z4 + 2.2]} rotation={0.85} />
        <HeroModule state={states.finished} position={[SX, bearer, z5]} />

        {/* Finished stock along the opposite wall. */}
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[15.5, bearer, -14 - i * 14]} rotation={[0, -Math.PI / 2, 0]}>
            <Capsule type={i % 3 === 2 ? 'base' : 'extended'} />
          </group>
        ))}
      </ModelSlot>

      <group position={[SX, bearer, z5]}>
        {LAYER_POINTS.map((point, i) => (
          <Callout key={i} position={point} label={LAYER_NAMES[i]} sub={`0${i + 1}`} value={layerValue(i)} side={i === 3 ? 'left' : 'right'} />
        ))}
      </group>
    </>
  );
}
