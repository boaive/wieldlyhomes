import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import { useStage } from '../state/stage';
import { Stage } from './core/Stage';
import { SCENES } from './scenes/registry';

const DPR: Record<'low' | 'mid' | 'high', number> = { low: 1.5, mid: 1.5, high: 2 };

/**
 * The single WebGL canvas behind the page. It is fixed to the viewport; the
 * DOM chapters scroll over it and tell it, through `state/stage`, what to show.
 */
export default function Experience({ veil }: { veil: React.RefObject<HTMLDivElement | null> }) {
  const tier = useStage((s) => s.tier);
  const setWebgl = useStage((s) => s.setWebgl);
  const markLoaded = useStage((s) => s.markLoaded);
  const [events, setEvents] = useState<HTMLElement | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEvents(document.getElementById('root'));
    markLoaded('engine');
  }, [markLoaded]);

  return (
    <div ref={container} className="stage" aria-hidden="true">
      {events && (
        <Canvas
          eventSource={events}
          eventPrefix="client"
          shadows={tier === 'low' ? false : 'percentage'}
          dpr={[1, Math.min(DPR[tier], window.devicePixelRatio || 1)]}
          camera={{ fov: 32, near: 0.2, far: 900, position: [-27, 4.4, 76] }}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.localClippingEnabled = true;
            gl.setClearColor('#0b1720');
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setWebgl(false);
            });
          }}
        >
          <Stage scenes={SCENES} veil={veil} />
        </Canvas>
      )}
    </div>
  );
}
