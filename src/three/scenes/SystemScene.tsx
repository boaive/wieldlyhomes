import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { PLAN_GROUPS } from '../../content/plans';
import { centred, exposureMask, rotationY, totals, worldCenter, CELL, GRID_D, GRID_W } from '../../lib/grid';
import { damp, lerp, smooth } from '../../lib/math';
import { usePlans } from '../../state/plans';
import { scroll } from '../../state/stage';
import { Appear } from '../core/Appear';
import { Builder, Built } from '../core/builder';
import { Callout } from '../core/Callout';
import { onScreen } from '../core/director';
import { Capsule } from '../objects/Capsule';
import { DimLine, Floor, LightPool } from '../objects/dressing';
import { HEIGHT } from '../objects/shell';
import { PAIR, precastLocal } from './system.def';

const win = (u: number, edge = 0.14) => {
  if (u <= 0 || u >= 1) return 0;
  const t = Math.min(1, Math.min(u, 1 - u) / edge);
  return t * t * (3 - 2 * t);
};

/** Catalogue arrangements, each centred on the origin. */
const ARRANGEMENTS = PLAN_GROUPS.map((group) => {
  const modules = centred(group.modules);
  const t = totals(modules);
  const b = t.bounds!;
  const cx = ((b.minX + b.maxX) / 2 - GRID_W / 2) * CELL;
  const cz = ((b.minZ + b.maxZ) / 2 - GRID_D / 2) * CELL;
  return {
    area: group.area,
    width: t.widthM,
    depth: t.depthM,
    modules: modules.map((m) => {
      const [x, , z] = worldCenter(m);
      return { id: m.id, type: m.type, position: [x - cx, 0.14, z - cz] as [number, number, number], ry: rotationY(m.rot), mask: exposureMask(m, modules) };
    }),
  };
});

export default function SystemScene() {
  const area = usePlans((s) => s.area);
  const areaRef = useRef(area);
  areaRef.current = area;
  const base = useRef<Group>(null);
  const v = useMemo(() => ({ pair: 1, a: 0, b: 0, c: 0, plans: ARRANGEMENTS.map(() => 0) }), []);

  const bearers = useMemo(() => {
    const mk = (xs: number[]) => {
      const b = new Builder();
      for (const x of xs) b.box('steel', 0.25, PAIR.y, 3.4, x, PAIR.y / 2, 0);
      return b.build();
    };
    return { base: mk([-0.9, 0.9]), extended: mk([-2.2, 0, 2.2]) };
  }, []);

  const plinths = useMemo(
    () =>
      ARRANGEMENTS.map((a) => {
        const b = new Builder();
        b.box('slab', a.width + 1.2, 0.14, a.depth + 1.2, 0, 0.07, 0);
        return b.build();
      }),
    [],
  );

  useFrame((_, dt) => {
    if (!onScreen('system')) return;
    const p = scroll.p.precast;
    const inPlans = scroll.chapter === 'plans';
    v.pair = damp(v.pair, inPlans ? 0 : 1, 6, dt);
    v.a = inPlans ? 0 : win(precastLocal(p, 0));
    v.b = inPlans ? 0 : win(precastLocal(p, 1));
    const join = smooth(precastLocal(p, 2), 0.08, 0.5);
    v.c = inPlans ? 0 : smooth(precastLocal(p, 2), 0.45, 0.6);
    if (base.current) base.current.position.x = lerp(PAIR.baseX, PAIR.extendedX + 4.5, join);
    ARRANGEMENTS.forEach((a, i) => {
      v.plans[i] = damp(v.plans[i], inPlans && a.area === areaRef.current ? 1 : 0, 7, dt);
    });
  });

  const bx = PAIR.baseX;
  const ex = PAIR.extendedX;

  return (
    <>
      <Floor grid={36} />
      <LightPool radius={20} opacity={0.12} />

      <Appear value={() => v.pair} rise={0}>
        <group ref={base} position={[bx, 0, 0]}>
          <Built parts={bearers.base} />
          <group position={[0, PAIR.y, 0]}>
            <Capsule type="base" />
          </group>
        </group>
        <group position={[ex, 0, 0]}>
          <Built parts={bearers.extended} />
          <group position={[0, PAIR.y, 0]}>
            <Capsule type="extended" />
          </group>
        </group>
      </Appear>

      <Appear value={() => v.a} rise={0}>
        <DimLine from={[bx - 1.5, 0.03, 2.4]} to={[bx + 1.5, 0.03, 2.4]} tick={[0, 0, 0.22]} />
        <DimLine from={[bx - 2.3, 0.03, -1.5]} to={[bx - 2.3, 0.03, 1.5]} tick={[0.22, 0, 0]} />
      </Appear>
      <Callout position={[bx, 0.03, 2.4]} label="3 000" sub="mm" value={() => v.a} side="top" />
      <Callout position={[bx - 2.3, 0.03, 0]} label="3 000" sub="mm" value={() => v.a} side="left" />
      <Callout position={[bx + 1.5, PAIR.y + HEIGHT + 0.2, 1.5]} label="100 sq ft" sub="Base capsule" value={() => v.a} />

      <Appear value={() => v.b} rise={0}>
        <DimLine from={[ex - 3, 0.03, 2.4]} to={[ex + 3, 0.03, 2.4]} tick={[0, 0, 0.22]} />
        <DimLine from={[ex + 3.8, 0.03, -1.5]} to={[ex + 3.8, 0.03, 1.5]} tick={[0.22, 0, 0]} />
      </Appear>
      <Callout position={[ex, 0.03, 2.4]} label="6 000" sub="mm" value={() => v.b} side="top" />
      <Callout position={[ex + 3.8, 0.03, 0]} label="3 000" sub="mm" value={() => v.b} />
      <Callout position={[ex - 3, PAIR.y + HEIGHT + 0.2, 1.5]} label="200 sq ft" sub="Extended capsule" value={() => v.b} side="left" />

      <Callout position={[ex + 3, PAIR.y + HEIGHT + 0.25, 1.5]} label="27 sqm" sub="Two units · ≈290 sq ft" value={() => v.c} side="top" />

      {ARRANGEMENTS.map((a, i) => (
        <Appear key={a.area} value={() => v.plans[i]} rise={0.5}>
          <Built parts={plinths[i]} cast={false} />
          {a.modules.map((m) => (
            <group key={m.id} position={m.position} rotation={[0, m.ry, 0]}>
              <Capsule type={m.type} mask={m.mask} />
            </group>
          ))}
        </Appear>
      ))}
    </>
  );
}
