import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, Float32BufferAttribute, MeshBasicMaterial, SphereGeometry, Vector3, type Mesh } from 'three';
import { smooth } from '../../lib/math';

interface SkyDomeProps {
  /** Colour overhead. */
  top: string;
  /** Colour at the horizon — should match the scene's fog colour. */
  horizon: string;
  /** Warm glow colour around `glowDir`. */
  glow?: string;
  glowDir?: [number, number, number];
  glowSize?: number;
}

/**
 * A vertex-coloured sky gradient. Being a regular tone-mapped mesh, its horizon
 * matches the fogged ground exactly, so the scene has no visible horizon seam.
 */
export function SkyDome({ top, horizon, glow, glowDir = [0, 0.1, -1], glowSize = 0.9 }: SkyDomeProps) {
  const ref = useRef<Mesh>(null);

  const geometry = useMemo(() => {
    const g = new SphereGeometry(420, 64, 48);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cTop = new Color(top);
    const cHor = new Color(horizon);
    const cGlow = glow ? new Color(glow) : null;
    const dir = new Vector3(...glowDir).normalize();
    const v = new Vector3();
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      c.copy(cHor).lerp(cTop, smooth(v.y, 0.0, 0.42));
      if (cGlow) {
        // A low band of afterglow, strongest toward `glowDir` and gone a few degrees up.
        const azimuth = smooth(v.x * dir.x + v.z * dir.z, 1 - glowSize, 1);
        const band = 1 - smooth(v.y, 0.0, 0.2);
        c.lerp(cGlow, azimuth * band * 0.9);
      }
      if (v.y < 0) c.copy(cHor);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return g;
  }, [top, horizon, glow, glowDir, glowSize]);

  const material = useMemo(
    () => new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, depthWrite: false, toneMapped: false }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position);
  });

  return <mesh ref={ref} geometry={geometry} material={material} renderOrder={-900} frustumCulled={false} />;
}
