import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { clamp } from '../../lib/math';

interface CalloutProps {
  position: [number, number, number];
  label: string;
  sub?: string;
  /** 0–1 visibility for the current frame. Defaults to always visible. */
  value?: () => number;
  /** Which side of the anchor the text sits on. */
  side?: 'left' | 'right' | 'top';
}

const _v = new Vector3();

/**
 * A technical label pinned to a point in the scene.
 * It is a plain DOM node (crisp type, selectable, no texture cost) that is
 * re-projected every frame into the #callouts layer.
 */
export function Callout({ position, label, sub, value, side = 'right' }: CalloutProps) {
  const anchor = useRef<Group>(null);
  const node = useRef<HTMLDivElement | null>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const layer = document.getElementById('callouts');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = `callout callout--${side}`;
    el.setAttribute('aria-hidden', 'true');
    const tick = document.createElement('span');
    tick.className = 'callout__tick';
    const text = document.createElement('span');
    text.className = 'callout__label';
    text.textContent = label;
    el.append(tick, text);
    if (sub) {
      const small = document.createElement('span');
      small.className = 'callout__sub';
      small.textContent = sub;
      el.append(small);
    }
    el.style.opacity = '0';
    layer.append(el);
    node.current = el;
    return () => {
      el.remove();
      node.current = null;
    };
  }, [label, sub, side]);

  useFrame(() => {
    const el = node.current;
    const a = anchor.current;
    if (!el || !a) return;

    // Hidden when any ancestor group is hidden (inactive scene).
    let visible = true;
    for (let o: Group['parent'] = a; o; o = o.parent) {
      if (!o.visible) {
        visible = false;
        break;
      }
    }
    const v = visible ? clamp(value ? value() : 1) : 0;
    if (v < 0.01) {
      if (el.style.opacity !== '0') el.style.opacity = '0';
      return;
    }
    a.getWorldPosition(_v).project(camera);
    if (_v.z > 1 || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2) {
      el.style.opacity = '0';
      return;
    }
    const x = (_v.x * 0.5 + 0.5) * size.width;
    const y = (-_v.y * 0.5 + 0.5) * size.height;
    el.style.opacity = v.toFixed(2);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  });

  return <group ref={anchor} position={position} />;
}
