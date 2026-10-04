import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EdgesGeometry, ExtrudeGeometry, Shape } from 'three';
import { futureAssets } from '../../config/assets';
import { damp } from '../../lib/math';
import { Appear } from '../core/Appear';
import { Builder, Built, type BuiltPart } from '../core/builder';
import { onScreen } from '../core/director';
import { L } from '../core/materials';
import { ModelSlot } from '../core/ModelSlot';
import { Floor, LightPool } from '../objects/dressing';
import { futureIndex } from './future.def';

/**
 * Future offerings are shown as clay concept models with drawn edges —
 * deliberately less resolved than Modular Precast, because they are not yet
 * available to configure.
 */

/** Labour Precamp — a two-storey accommodation block with gallery access. */
function buildPrecamp() {
  const b = new Builder();
  const L0 = 18;
  const bays = 5;
  const bay = L0 / bays;
  const base = 0.6;
  const storey = 2.9;

  for (let i = 0; i <= bays; i++) {
    for (const z of [-2.2, 2.2, 3.9]) b.box('concreteDark', 0.45, base, 0.45, -L0 / 2 + i * bay, base / 2, z);
  }
  for (let level = 0; level < 2; level++) {
    const y0 = base + level * storey;
    b.box('concreteDark', L0 + 0.3, 0.18, 7.0, 0, y0 + 0.09, 0.75);
    b.box('clay', L0, storey - 0.18, 5.4, 0, y0 + 0.18 + (storey - 0.18) / 2, 0);
    for (let i = 0; i < bays; i++) {
      const x = -L0 / 2 + i * bay;
      b.box('glassDark', 0.9, 2.05, 0.04, x + 0.85, y0 + 0.18 + 1.025, 2.71);
      b.box('glassDark', 1.25, 1.0, 0.04, x + 2.45, y0 + 1.75, 2.71);
      b.box('glassDark', 1.25, 0.7, 0.04, x + 1.8, y0 + 1.95, -2.71);
      b.box('steelMid', 0.03, storey - 0.2, 0.03, x, y0 + 0.18 + (storey - 0.2) / 2, 2.715);
    }
    // Gallery rail.
    const ry = y0 + 0.18;
    b.box('galv', L0 + 0.3, 0.05, 0.05, 0, ry + 1.05, 4.2).box('galv', L0 + 0.3, 0.03, 0.03, 0, ry + 0.55, 4.2);
  }
  for (let i = 0; i <= bays; i++) b.box('galv', 0.08, storey * 2 + 0.3, 0.08, -L0 / 2 + i * bay, base + storey + 0.15, 4.2);

  // Stair at the end of the gallery.
  const steps = 17;
  for (let i = 0; i < steps; i++) {
    b.box('clay', 0.3, 0.04, 1.25, L0 / 2 + 0.6 + i * 0.3, base + storey + 0.14 - (i + 1) * ((base + storey + 0.1) / (steps + 1)), 3.5);
  }
  for (const z of [2.86, 4.14]) b.beam('galv', 0.07, L0 / 2 + 0.3, base + storey + 0.05, z, L0 / 2 + 0.75 + steps * 0.3, 0.04, z);

  // Mono-pitch roof.
  b.box('concreteDark', L0 + 1.4, 0.14, 8.6, 0, base + storey * 2 + 0.42, 0.75, 0, 0.06);
  return b.build();
}

/** Capsule House — a single chamfered shell with a glazed front and a balcony. */
function buildCapsuleHouse() {
  const b = new Builder();
  const lift = 0.7;
  const w = 3.3;
  const h = 3.2;
  const c = 0.5;
  const section = new Shape();
  section.moveTo(-w / 2 + c, 0);
  section.lineTo(w / 2 - c, 0);
  section.lineTo(w / 2, c);
  section.lineTo(w / 2, h - c);
  section.lineTo(w / 2 - c, h);
  section.lineTo(-w / 2 + c, h);
  section.lineTo(-w / 2, h - c);
  section.lineTo(-w / 2, c);
  section.closePath();

  const body = new ExtrudeGeometry(section, { depth: 9.6, bevelEnabled: false });
  body.rotateY(Math.PI / 2);
  b.add('clay', body, -5.75, lift, 0);

  // Balcony: floor, roof overhang and glass rail.
  const deck = new Shape();
  deck.moveTo(-w / 2 + c, 0);
  deck.lineTo(w / 2 - c, 0);
  deck.lineTo(w / 2, c);
  deck.lineTo(-w / 2, c);
  deck.closePath();
  const floor = new ExtrudeGeometry(deck, { depth: 1.9, bevelEnabled: false });
  floor.rotateY(Math.PI / 2);
  b.add('clay', floor, 3.85, lift, 0);
  b.box('clay', 1.9, 0.26, w - 0.9, 4.8, lift + h - 0.13, 0);
  b.box('glass', 0.02, 1.0, w - 0.2, 5.72, lift + 0.8, 0);
  b.box('glass', 1.86, 1.0, 0.02, 4.8, lift + 0.8, w / 2 - 0.1).box('glass', 1.86, 1.0, 0.02, 4.8, lift + 0.8, -w / 2 + 0.1);
  b.box('glassDark', 0.04, 2.25, 2.3, 3.87, lift + 1.45, 0);

  // Long-side glazing and door.
  const z = w / 2 + 0.012;
  b.box('glassDark', 4.3, 1.9, 0.03, 0.9, lift + 1.62, z);
  b.box('steel', 4.5, 0.08, 0.05, 0.9, lift + 2.61, z).box('steel', 4.5, 0.08, 0.05, 0.9, lift + 0.63, z);
  b.box('steel', 0.08, 2.06, 0.05, -1.31, lift + 1.62, z).box('steel', 0.08, 2.06, 0.05, 3.11, lift + 1.62, z);
  b.box('steel', 0.05, 1.9, 0.05, 0.2, lift + 1.62, z).box('steel', 0.05, 1.9, 0.05, 1.6, lift + 1.62, z);
  b.box('steelMid', 0.95, 2.1, 0.03, -2.7, lift + 1.52, z);
  b.box('glassDark', 1.3, 1.9, 0.03, -4.6, lift + 1.62, z);
  b.box('glassDark', 2.2, 0.8, 0.03, -1.0, lift + 2.0, -z);

  // Piers and entry steps.
  for (const x of [-5.0, -1.6, 1.8, 5.1]) {
    for (const pz of [-1.05, 1.05]) b.box('concreteDark', 0.5, lift, 0.5, x, lift / 2, pz);
  }
  for (let i = 0; i < 3; i++) b.box('clay', 1.1, 0.05, 0.3, -2.7, lift + 0.3 - (i + 1) * 0.24, w / 2 + 0.2 + i * 0.3);
  return b.build();
}

/** A drawn outline for every clay surface. */
function Edges({ parts }: { parts: BuiltPart[] }) {
  const edges = useMemo(
    () => parts.filter((p) => p.mat === 'clay' || p.mat === 'concreteDark').map((p) => new EdgesGeometry(p.geometry, 28)),
    [parts],
  );
  useEffect(() => () => edges.forEach((e) => e.dispose()), [edges]);
  return (
    <>
      {edges.map((g, i) => (
        <lineSegments key={i} geometry={g} material={L.ivoryDim} />
      ))}
    </>
  );
}

export default function FutureScene() {
  const precamp = useMemo(buildPrecamp, []);
  const capsule = useMemo(buildCapsuleHouse, []);
  const v = useMemo(() => ({ precamp: 1, capsule: 0 }), []);

  useFrame((_, dt) => {
    if (!onScreen('future')) return;
    const index = futureIndex();
    v.precamp = damp(v.precamp, index === 0 ? 1 : 0, 6, dt);
    v.capsule = damp(v.capsule, index === 1 ? 1 : 0, 6, dt);
  });

  return (
    <>
      <Floor grid={36} />
      <LightPool radius={24} opacity={0.12} />
      <Appear value={() => v.precamp} rise={0.4} position={[0, 0, -0.75]}>
        <ModelSlot src={futureAssets.labourPrecamp}>
          <Built parts={precamp} />
          <Edges parts={precamp} />
        </ModelSlot>
      </Appear>
      <Appear value={() => v.capsule} rise={0.4}>
        <ModelSlot src={futureAssets.capsuleHouse}>
          <Built parts={capsule} />
          <Edges parts={capsule} />
        </ModelSlot>
      </Appear>
    </>
  );
}
