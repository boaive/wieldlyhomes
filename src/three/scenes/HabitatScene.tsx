import { useMemo } from 'react';
import { interiorAssets } from '../../config/assets';
import { Builder, Built } from '../core/builder';
import { ModelSlot } from '../core/ModelSlot';
import { SkyDome } from '../core/SkyDome';
import { Floor, ScaleFigure, rand, treeParts } from '../objects/dressing';

const H = 2.6;

/** Envelope, partitions and glazing of the finished interior (6m × 6m, two extended capsules). */
function buildShell() {
  const b = new Builder();

  // Floor, ceiling and the plank joints of the timber floor.
  b.box('timber', 6.4, 0.1, 6.4, 0, -0.05, 0);
  for (let x = -2.9; x < 3; x += 0.19) b.box('timberDark', 0.008, 0.003, 6.2, x, 0.0015, 0);
  b.box('concrete', 6.6, 0.22, 6.6, 0, H + 0.11, 0);

  // Outer walls. The left wall has the bedroom window.
  b.box('ivory', 6.4, H, 0.2, 0, H / 2, -3.1);
  b.box('ivory', 0.2, H, 6.2, 3.1, H / 2, 0);
  b.box('ivory', 0.2, H, 0.8, -3.1, H / 2, -2.6).box('ivory', 0.2, H, 3.8, -3.1, H / 2, 1.1);
  b.box('ivory', 0.2, 0.9, 1.4, -3.1, 0.45, -1.5).box('ivory', 0.2, 0.5, 1.4, -3.1, 2.35, -1.5);
  b.box('glass', 0.02, 1.2, 1.4, -3.1, 1.5, -1.5);
  b.box('steel', 0.06, 0.04, 1.4, -3.06, 0.92, -1.5).box('steel', 0.06, 0.04, 1.4, -3.06, 2.08, -1.5);

  // Partitions with door openings.
  b.box('ivory', 2.5, H, 0.1, -1.75, H / 2, 0.2).box('ivory', 2.6, H, 0.1, 1.7, H / 2, 0.2);
  b.box('ivory', 0.9, 0.5, 0.1, -0.05, 2.35, 0.2);
  b.box('ivory', 0.1, H, 2.0, 0.5, H / 2, -2.0).box('ivory', 0.1, H, 0.3, 0.5, H / 2, 0.05);
  b.box('ivory', 0.1, 0.5, 0.9, 0.5, 2.35, -0.55);

  // Front glazing with the sliding door left open onto the deck.
  for (const x of [-3, -2.0, -0.4, 1.3, 3]) b.box('steel', 0.06, H, 0.08, x, H / 2, 3);
  b.box('steel', 6, 0.07, 0.08, 0, H - 0.035, 3).box('steel', 6, 0.04, 0.08, 0, 0.02, 3);
  b.box('glass', 0.94, H - 0.12, 0.02, -2.5, H / 2, 3);
  b.box('glass', 1.64, H - 0.12, 0.02, 0.45, H / 2, 3).box('glass', 1.64, H - 0.12, 0.02, 2.15, H / 2, 3);
  b.box('glass', 1.5, H - 0.12, 0.02, -2.72, H / 2, 3.06);

  // Ceiling coves.
  b.box('warmGlow', 5.4, 0.016, 0.04, 0, H - 0.01, 0.32);
  b.box('warmGlow', 0.04, 0.016, 2.6, -2.92, H - 0.01, -1.4);

  // Bathroom: tiled floor and walls.
  b.box('tile', 2.45, 0.012, 3.12, 1.77, 0.006, -1.43);
  b.box('tile', 2.45, H, 0.012, 1.77, H / 2, -2.992).box('tile', 0.012, H, 3.1, 2.992, H / 2, -1.43);
  b.box('tile', 2.45, H, 0.012, 1.77, H / 2, 0.142).box('tile', 0.012, H, 2.0, 0.558, H / 2, -2.0);
  return b.build();
}

function buildFurniture() {
  const b = new Builder();
  const legs = (x: number, z: number, w: number, d: number, h: number, mat: 'steel' | 'timberDark' = 'steel') => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(mat, 0.035, h, 0.035, x + sx * (w / 2 - 0.04), h / 2, z + sz * (d / 2 - 0.04));
  };

  // Living — sofa, low table, rug, pendant.
  b.box('ivory', 2.3, 0.012, 2.0, 1.45, 0.006, 1.95);
  b.box('fabric', 0.92, 0.36, 1.8, 2.5, 0.25, 2.0).box('fabric', 0.2, 0.74, 1.8, 2.88, 0.44, 2.0);
  b.box('fabric', 0.92, 0.5, 0.16, 2.5, 0.32, 1.1).box('fabric', 0.92, 0.5, 0.16, 2.5, 0.32, 2.9);
  b.box('sage', 0.14, 0.4, 0.44, 2.66, 0.62, 1.55).box('fabricDark', 0.14, 0.4, 0.44, 2.66, 0.62, 2.45);
  b.cyl('timberDark', 0.44, 0.035, 1.3, 0.36, 1.95, 0, 0, 0, 28);
  legs(1.3, 1.95, 0.6, 0.6, 0.34);
  b.cyl('brass', 0.07, 0.11, 1.2, 0.435, 2.0, 0, 0, 0, 16);
  b.cyl('steel', 0.005, 0.72, 1.3, 2.24, 1.95, 0, 0, 0, 6);
  b.cyl('brass', 0.17, 0.16, 1.3, 1.82, 1.95, 0, 0, 0, 24, 0.05);
  b.sphere('warmGlow', 0.05, 1.3, 1.76, 1.95);
  b.box('timber', 0.02, 2.36, 1.9, 2.99, 1.3, 2.0);
  for (let i = 0; i < 24; i++) b.box('timber', 0.03, 2.36, 0.045, 2.972, 1.3, 1.08 + i * 0.08);

  // Study desk on the left wall, shelf and plant.
  b.box('timber', 0.68, 0.04, 1.5, -2.64, 0.74, 1.35);
  b.box('steel', 0.035, 0.72, 0.035, -2.34, 0.36, 0.66).box('steel', 0.035, 0.72, 0.035, -2.34, 0.36, 2.04);
  b.box('timberDark', 0.46, 0.04, 0.46, -1.95, 0.46, 1.35).box('timberDark', 0.04, 0.44, 0.46, -1.74, 0.7, 1.35);
  legs(-1.95, 1.35, 0.46, 0.46, 0.44, 'timberDark');
  b.box('timber', 1.9, 0.035, 0.24, -1.85, 1.5, 0.38);
  b.box('ivory', 0.05, 0.24, 0.17, -2.6, 1.64, 0.38).box('fabricDark', 0.06, 0.28, 0.17, -2.53, 1.66, 0.38).box('sage', 0.05, 0.22, 0.17, -2.46, 1.63, 0.38);
  b.cyl('brass', 0.06, 0.2, -1.3, 1.62, 0.38, 0, 0, 0, 14, 0.035);
  b.cyl('ivory', 0.17, 0.34, -2.62, 0.17, 2.6, 0, 0, 0, 18, 0.2);
  b.sphere('sage', 0.34, -2.62, 0.8, 2.6, 1.5, 12);

  // Kitchen — pantry counter on the living wall.
  b.box('timber', 2.05, 0.84, 0.6, 1.93, 0.44, 0.56).box('steel', 2.05, 0.04, 0.56, 1.93, 0.02, 0.54);
  for (const x of [1.25, 1.93, 2.61]) b.box('steel', 0.006, 0.8, 0.012, x - 0.34, 0.44, 0.862);
  b.box('stone', 2.1, 0.04, 0.64, 1.93, 0.88, 0.57);
  b.box('steel', 0.5, 0.008, 0.36, 1.45, 0.903, 0.57);
  b.cyl('brass', 0.012, 0.26, 1.45, 1.03, 0.36, 0, 0, 0, 8);
  b.box('brass', 0.024, 0.024, 0.16, 1.45, 1.16, 0.43);
  b.box('tile', 2.1, 0.56, 0.012, 1.93, 1.18, 0.258);
  b.box('timber', 2.05, 0.035, 0.26, 1.93, 1.52, 0.39);
  b.box('warmGlow', 1.9, 0.01, 0.02, 1.93, 1.498, 0.47);
  for (const [x, r, h] of [[2.3, 0.045, 0.1], [2.42, 0.045, 0.1], [2.56, 0.06, 0.16], [1.2, 0.05, 0.2]] as const) {
    b.cyl('ivory', r, h, x, 1.54 + h / 2, 0.39, 0, 0, 0, 14);
  }
  b.cyl('brass', 0.07, 0.03, 2.5, 0.915, 0.6, 0, 0, 0, 16);

  // Bedroom — bed, bedside tables, wardrobe, curtain.
  b.box('timberDark', 1.62, 0.26, 2.06, -1.7, 0.2, -1.9);
  b.box('ivory', 1.54, 0.18, 1.98, -1.7, 0.42, -1.9);
  b.box('fabric', 0.6, 0.11, 0.38, -2.06, 0.56, -2.68).box('fabric', 0.6, 0.11, 0.38, -1.34, 0.56, -2.68);
  b.box('fabricDark', 1.56, 0.03, 0.76, -1.7, 0.525, -1.25);
  b.box('timber', 1.9, 1.0, 0.06, -1.7, 0.76, -2.96);
  b.box('timber', 0.4, 0.4, 0.36, -2.74, 0.2, -2.76).box('timber', 0.4, 0.4, 0.36, -0.66, 0.2, -2.76);
  b.cyl('brass', 0.008, 0.24, -0.66, 0.52, -2.76, 0, 0, 0, 6);
  b.cyl('warmGlow', 0.08, 0.13, -0.66, 0.68, -2.76, 0, 0, 0, 14, 0.06);
  b.box('timber', 0.56, 2.42, 1.86, 0.17, 1.21, -2.05);
  b.box('steel', 0.008, 2.34, 0.012, -0.112, 1.21, -2.05).box('steel', 0.008, 2.34, 0.012, -0.112, 1.21, -1.43).box('steel', 0.008, 2.34, 0.012, -0.112, 1.21, -2.67);
  b.box('fabric', 0.05, 2.36, 0.5, -2.95, 1.3, -0.6);
  b.box('ivory', 1.9, 0.012, 1.3, -1.6, 0.006, -0.75);

  // Bathroom — vanity, mirror, WC, shower screen.
  b.box('timber', 1.3, 0.42, 0.46, 1.45, 0.6, -2.74);
  b.box('stone', 1.36, 0.05, 0.5, 1.45, 0.835, -2.73);
  b.cyl('ivory', 0.19, 0.1, 1.45, 0.91, -2.72, 0, 0, 0, 22, 0.15);
  b.cyl('brass', 0.011, 0.24, 1.45, 0.98, -2.93, 0, 0, 0, 8);
  b.box('mirror', 1.1, 0.8, 0.014, 1.45, 1.58, -2.978);
  b.box('warmGlow', 1.1, 0.02, 0.03, 1.45, 2.03, -2.97);
  b.box('ivory', 0.38, 0.4, 0.5, 2.66, 0.2, -1.75).box('ivory', 0.42, 0.34, 0.16, 2.66, 0.6, -1.98);
  b.box('glass', 0.016, 2.1, 1.2, 2.12, 1.05, -0.5);
  b.cyl('brass', 0.01, 0.34, 2.82, 2.08, -0.5, 0, 0, Math.PI / 2, 8);
  b.cyl('brass', 0.09, 0.02, 2.66, 2.06, -0.5, 0, 0, 0, 16);
  b.cyl('brass', 0.01, 0.6, 0.6, 1.2, -1.55, Math.PI / 2, 0, 0, 8);
  b.box('fabric', 0.03, 0.5, 0.4, 0.61, 0.96, -1.55);
  return b.build();
}

/** Deck, pergola and the landscape beyond. */
function buildOutside() {
  const b = new Builder();
  for (let i = 0; i < 16; i++) b.box('timber', 6.2, 0.035, 0.145, 0, -0.02, 3.1 + i * 0.16);
  b.box('steel', 6.2, 0.14, 0.06, 0, -0.1, 5.62);
  for (const x of [-3, 0, 3]) {
    b.box('steel', 0.07, 3.4, 0.07, x, 0.9, 5.56);
    b.box('steel', 0.07, 0.1, 2.6, x, H + 0.02, 4.3);
  }
  b.box('steel', 6.1, 0.1, 0.07, 0, H + 0.02, 5.56);
  for (let i = 0; i < 12; i++) b.box('timber', 6.0, 0.03, 0.1, 0, H + 0.09, 3.2 + i * 0.205);

  // Two low chairs and a side table.
  for (const x of [0.9, 2.0]) {
    b.box('timberDark', 0.6, 0.05, 0.62, x, 0.3, 4.35).box('timberDark', 0.6, 0.52, 0.05, x, 0.52, 4.04, 0, -0.22);
    b.box('fabric', 0.52, 0.07, 0.52, x, 0.36, 4.37);
    for (const sx of [-0.27, 0.27]) b.box('steel', 0.03, 0.3, 0.6, x + sx, 0.15, 4.35);
  }
  b.cyl('timber', 0.2, 0.36, 1.45, 0.18, 4.75, 0, 0, 0, 18);

  // Module edge and steps down to the garden.
  b.box('concreteDark', 6.6, 0.6, 9, 0, -0.42, 1.3);
  for (let i = 0; i < 3; i++) b.box('timber', 1.4, 0.04, 0.3, -1.6, -0.2 - i * 0.18, 5.85 + i * 0.3);
  return b.build();
}

function buildLandscape() {
  const trees: [number, number, number][] = [];
  for (let i = 0; i < 40; i++) {
    const x = -70 + rand(i * 7) * 140;
    const z = 26 + rand(i * 5) * 70;
    trees.push([x, z, 0.7 + rand(i * 3) * 0.8]);
  }
  const hills = new Builder();
  for (let i = 0; i < 7; i++) {
    const r = 60 + rand(i * 9) * 60;
    hills.sphere('grass', r, -260 + i * 85, -r * 0.74, 190 + rand(i * 4) * 70, 1, 20);
  }
  return { trees: treeParts(trees, -0.72), hills: hills.build() };
}

/** Interior tour of the finished building. */
export default function HabitatScene() {
  const shell = useMemo(buildShell, []);
  const furniture = useMemo(buildFurniture, []);
  const outside = useMemo(buildOutside, []);
  const land = useMemo(buildLandscape, []);

  return (
    <>
      <SkyDome top="#0c1c28" horizon="#33495a" glow="#dfa074" glowDir={[0.35, 0, 1]} glowSize={0.6} />
      <Floor mat="grass" radius={520} y={-0.72} />
      <Built parts={land.trees} />
      <Built parts={land.hills} cast={false} />

      <ModelSlot src={interiorAssets.habitat}>
        <Built parts={shell} />
        <Built parts={furniture} />
        <Built parts={outside} />
        <ScaleFigure position={[5.2, -0.72, 11.5]} rotation={0.6} />
      </ModelSlot>
    </>
  );
}
