import { useEffect } from 'react';
import { brand } from '../config/site';
import { useStage } from '../state/stage';
import { Mark } from './Nav';

const STEPS = [
  ['type', 'Typography'],
  ['engine', 'Engine'],
  ['scene', 'Scene'],
  ['frame', 'First light'],
] as const;

/**
 * Opening state. The bar reflects real milestones — fonts, the 3D engine chunk,
 * the first scene's shaders, the first rendered frame — never a timer.
 */
export function Loader() {
  const loaded = useStage((s) => s.loaded);
  const webgl = useStage((s) => s.webgl);
  const ready = useStage((s) => s.ready);
  const setReady = useStage((s) => s.setReady);
  const setWebgl = useStage((s) => s.setWebgl);

  const steps = webgl ? STEPS : STEPS.slice(0, 1);
  const done = steps.filter(([key]) => loaded[key]).length;
  const complete = done === steps.length;
  const current = steps[Math.min(done, steps.length - 1)][1];

  useEffect(() => {
    if (!complete || ready) return;
    const id = window.setTimeout(setReady, 420);
    return () => window.clearTimeout(id);
  }, [complete, ready, setReady]);

  // If the 3D engine never arrives, continue with the static experience.
  useEffect(() => {
    if (ready || !webgl) return;
    const id = window.setTimeout(() => {
      if (!useStage.getState().ready) setWebgl(false);
    }, 15000);
    return () => window.clearTimeout(id);
  }, [ready, webgl, setWebgl]);

  useEffect(() => {
    document.body.classList.toggle('is-locked', !ready);
  }, [ready]);

  return (
    <div className={`loader ${ready ? 'is-done' : ''}`} role="status" aria-live="polite" aria-hidden={ready}>
      <div className="loader__inner">
        <Mark className="loader__mark" />
        <p className="loader__name">{brand.name}</p>
        <div className="loader__bar">
          <span style={{ transform: `scaleX(${done / steps.length})` }} />
        </div>
        <div className="loader__meta">
          <span className="label">Initializing experience</span>
          <span className="label">
            {complete ? 'Ready' : current} · {String(done).padStart(2, '0')}/{String(steps.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
