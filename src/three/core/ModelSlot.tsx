import { Component, Suspense, lazy, type ReactNode } from 'react';
import type { AssetPath } from '../../config/assets';

const GltfModel = lazy(() => import('./GltfModel'));

class AssetBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[Wieldy] Model failed to load — using placeholder geometry.', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface ModelSlotProps {
  /** Path from the asset map, or null while the real asset is not supplied. */
  src: AssetPath;
  /** Procedural placeholder — shown when there is no asset, while it loads, and if it fails. */
  children: ReactNode;
}

/**
 * Swap point for real assets. Every placeholder object is wrapped in a
 * ModelSlot keyed to `config/assets.ts`; setting a path there replaces the
 * procedural geometry without touching scene code.
 */
export function ModelSlot({ src, children }: ModelSlotProps) {
  if (!src) return <>{children}</>;
  return (
    <AssetBoundary fallback={children}>
      <Suspense fallback={children}>
        <GltfModel src={src} />
      </Suspense>
    </AssetBoundary>
  );
}
