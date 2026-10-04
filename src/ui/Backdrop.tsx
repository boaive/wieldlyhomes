import { useMemo } from 'react';
import { PLAN_GROUPS } from '../content/plans';
import { centred, footprint, worldCenter, MODULE_H, type PlacedModule } from '../lib/grid';
import { shippedModules, useConfig } from '../state/config';
import { usePlans } from '../state/plans';
import { useStage, type ChapterId } from '../state/stage';

/**
 * Static stand-in for the 3D stage when WebGL is unavailable: an isometric
 * line drawing per chapter. The page, the copy, the plans and the configurator
 * (through its interactive floor plan) all keep working.
 */

interface Box {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  accent?: boolean;
}

const box = (x: number, y: number, z: number, w: number, h: number, d: number, accent = false): Box => ({ x, y, z, w, h, d, accent });

const COS = 0.866;
const SIN = 0.5;
const project = (x: number, y: number, z: number): [number, number] => [(x - z) * COS, (x + z) * SIN - y];

const moduleBoxes = (modules: PlacedModule[], lift = 0): Box[] =>
  modules.map((m) => {
    const [cx, cy, cz] = worldCenter(m);
    const [w, d] = footprint(m.type, m.rot);
    return box(cx - (w * 3) / 2, cy + lift, cz - (d * 3) / 2, w * 3, MODULE_H, d * 3);
  });

const piers = (x0: number, z0: number, w: number, d: number): Box[] => {
  const out: Box[] = [];
  for (let x = x0; x <= x0 + w + 0.01; x += 3) for (const z of [z0, z0 + d]) out.push(box(x - 0.2, 0, z - 0.2, 0.4, 0.6, 0.4));
  return out;
};

function compose(chapter: ChapterId, config: PlacedModule[], planModules: PlacedModule[]): Box[] {
  switch (chapter) {
    case 'enter':
      return [box(0, 0, 0, 44, 13, 30), box(17, 0, 30, 10, 0.2, 5), box(50, 0, 10, 6, 3, 3), box(50, 0, 17, 3, 3, 3), box(50, 0, 23, 6, 3, 3, true)];
    case 'reveal':
    case 'why':
    case 'ledger':
      return [box(-3, 0, -1.5, 6, 3, 3, true), box(-3, 3, -1.5, 6, 0.12, 3)];
    case 'story':
      return [...piers(-3, -1.5, 6, 3), box(-3, 0.6, -1.5, 6, 3, 3, true), box(-3, 0.5, 1.5, 6, 0.12, 2.4), box(-3.3, 3.6, -1.8, 6.6, 0.15, 3.6)];
    case 'precast':
      return [box(-7, 0, -1.5, 3, 3, 3), box(-1, 0, -1.5, 6, 3, 3, true)];
    case 'plans':
      return moduleBoxes(planModules);
    case 'configure':
      return config.length ? moduleBoxes(config) : [box(-10.5, 0, -7.5, 21, 0.05, 15)];
    case 'journey':
      return [box(-9, 1, -1.3, 12.6, 0.3, 2.6), box(4, 0.6, -1.25, 2.6, 2.6, 2.5), box(-8.6, 1.3, -1.5, 6, 3, 3, true), box(-14, 0, 5, 1, 14, 1)];
    case 'habitat':
      return [...piers(-3, -3, 6, 6), box(-3, 0.6, -3, 6, 3, 6, true), box(-3, 0.5, 3, 6, 0.12, 2.6), box(-3.3, 3.6, -3.3, 6.6, 0.15, 9)];
    case 'precamp':
      return [box(-9, 0.5, -2.7, 18, 2.8, 5.4), box(-9, 3.4, -2.7, 18, 2.8, 5.4, true), box(-9.2, 3.3, 2.7, 18.4, 0.15, 1.5), box(-9.6, 6.3, -3.2, 19.2, 0.15, 7.6)];
    default:
      return [...piers(-5, -1, 9, 2), box(-5.75, 0.7, -1.65, 9.6, 3.2, 3.3, true), box(3.85, 0.7, -1.65, 1.9, 0.3, 3.3), box(3.85, 3.6, -1.2, 1.9, 0.26, 2.4)];
  }
}

export function Backdrop() {
  const chapter = useStage((s) => s.chapter);
  const modules = useConfig((s) => s.modules);
  const area = usePlans((s) => s.area);

  const { faces, viewBox } = useMemo(() => {
    const planModules = centred(PLAN_GROUPS.find((g) => g.area === area)!.modules);
    const config = chapter === 'journey' ? shippedModules(modules) : modules;
    const boxes = compose(chapter, config, planModules).sort((a, b) => a.x + a.w / 2 + a.z + a.d / 2 + a.y * 0.01 - (b.x + b.w / 2 + b.z + b.d / 2 + b.y * 0.01));
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const faces: { points: string; tone: number; accent: boolean }[] = [];
    for (const b of boxes) {
      const { x, y, z, w, h, d } = b;
      const quads: [number, [number, number, number][]][] = [
        [0, [[x, y + h, z], [x + w, y + h, z], [x + w, y + h, z + d], [x, y + h, z + d]]],
        [1, [[x + w, y, z], [x + w, y, z + d], [x + w, y + h, z + d], [x + w, y + h, z]]],
        [2, [[x, y, z + d], [x + w, y, z + d], [x + w, y + h, z + d], [x, y + h, z + d]]],
      ];
      for (const [tone, quad] of quads) {
        const pts = quad.map(([px, py, pz]) => project(px, py, pz));
        for (const [sx, sy] of pts) {
          minX = Math.min(minX, sx);
          maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy);
          maxY = Math.max(maxY, sy);
        }
        faces.push({ points: pts.map((p) => p.map((n) => n.toFixed(2)).join(',')).join(' '), tone, accent: !!b.accent });
      }
    }
    const pad = Math.max(maxX - minX, maxY - minY) * 0.22 + 2;
    return { faces, viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}` };
  }, [chapter, modules, area]);

  const FILL = ['#1c2e3a', '#14232d', '#0f1c25'];

  return (
    <div className="backdrop" aria-hidden="true">
      <svg key={chapter} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        {faces.map((f, i) => (
          <polygon
            key={i}
            points={f.points}
            fill={FILL[f.tone]}
            stroke={f.accent ? 'rgba(241,238,229,0.78)' : 'rgba(241,238,229,0.34)'}
            strokeWidth="1"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <p className="label backdrop__note">Static view · 3D is unavailable on this device</p>
    </div>
  );
}
