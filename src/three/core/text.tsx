import { useEffect, useMemo } from 'react';
import { CanvasTexture, LinearMipmapLinearFilter, MeshBasicMaterial, SRGBColorSpace } from 'three';

interface TextOptions {
  /** CSS font shorthand without size, e.g. '500 "Manrope Variable"'. */
  font?: string;
  color?: string;
  /** Letter spacing in em. */
  tracking?: number;
  opacity?: number;
}

const SIZE = 128;

function draw(text: string, { font = '500 "Manrope Variable", sans-serif', color = '#f1eee5', tracking = 0.12 }: TextOptions) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${font.replace(/^(\d+)\s/, `$1 ${SIZE}px `)}`;
  const gap = SIZE * tracking;
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const width = Math.ceil(widths.reduce((a, b) => a + b + gap, 0) - gap + SIZE * 0.3);
  canvas.width = width;
  canvas.height = Math.ceil(SIZE * 1.4);
  ctx.font = `${font.replace(/^(\d+)\s/, `$1 ${SIZE}px `)}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  let x = SIZE * 0.15;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, canvas.height / 2);
    x += widths[i] + gap;
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  return { texture, aspect: canvas.width / canvas.height };
}

interface TextPlaneProps extends TextOptions {
  text: string;
  /** Cap height of the lettering in metres (the plane is 1.4× taller). */
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  /**
   * Lay the text flat on the floor, readable by a viewer looking along this
   * heading (radians about the vertical axis; 0 = looking toward -z).
   */
  floor?: number;
  /** Anchor the text by its left edge instead of its centre. */
  left?: boolean;
}

/** Flat lettering in the scene — signage and floor markings. */
export function TextPlane({ text, height, position, rotation, floor, left, opacity = 1, ...options }: TextPlaneProps) {
  const { font, color, tracking } = options;
  const { material, aspect } = useMemo(() => {
    const { texture, aspect } = draw(text, { font, color, tracking });
    const material = new MeshBasicMaterial({ map: texture, transparent: true, opacity, depthWrite: false });
    return { material, aspect };
  }, [text, font, color, tracking, opacity]);

  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );

  const h = height * 1.4;
  const w = h * aspect;
  return (
    <group position={position} rotation={floor !== undefined ? [0, floor, 0] : rotation}>
      <mesh position={[left ? w / 2 : 0, 0, 0]} rotation={floor !== undefined ? [-Math.PI / 2, 0, 0] : undefined} material={material} renderOrder={2}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}
