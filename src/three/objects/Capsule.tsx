import { useMemo } from 'react';
import { BoxGeometry, EdgesGeometry } from 'three';
import { moduleAssets } from '../../config/assets';
import { ALL_EXPOSED, type ModuleType } from '../../lib/grid';
import { Built } from '../core/builder';
import { L } from '../core/materials';
import { ModelSlot } from '../core/ModelSlot';
import { DEPTH, HEIGHT, capsuleParts, widthOf } from './shell';

interface CapsuleProps {
  type: ModuleType;
  /** Exposure bit-mask from `exposureMask` — joined faces are left open. */
  mask?: number;
}

/**
 * A finished Wieldy capsule: base (3m × 3m) or extended (6m × 3m).
 * Origin at the centre of the footprint, base at y = 0.
 */
export function Capsule({ type, mask = ALL_EXPOSED }: CapsuleProps) {
  const parts = useMemo(() => capsuleParts(type, mask), [type, mask]);
  return (
    <ModelSlot src={moduleAssets[type]}>
      <Built parts={parts} owned={false} />
    </ModelSlot>
  );
}

const edgeCache = new Map<ModuleType, EdgesGeometry>();
const edgesOf = (type: ModuleType) => {
  let g = edgeCache.get(type);
  if (!g) {
    const box = new BoxGeometry(widthOf(type), HEIGHT, DEPTH);
    box.translate(0, HEIGHT / 2, 0);
    g = new EdgesGeometry(box);
    box.dispose();
    edgeCache.set(type, g);
  }
  return g;
};

/** Thin outline of a capsule volume — design wireframes, selection, placement ghosts. */
export function CapsuleOutline({ type, tone = 'ivory', scale = 1 }: { type: ModuleType; tone?: keyof typeof L; scale?: number }) {
  return <lineSegments geometry={edgesOf(type)} material={L[tone]} scale={scale} />;
}
