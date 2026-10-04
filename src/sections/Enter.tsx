import { useState } from 'react';
import { hero, offsite } from '../content/copy';
import { ENTER, LENGTH } from '../content/timeline';
import { useStage } from '../state/stage';
import { Arrow } from '../ui/Arrow';
import { BeatStack, Chapter, Label, Show, Steps, Title } from '../ui/Chapter';

type View = { phase: 'hero' | 'travel' | 'title' | 'stations'; beat: number };

const STOPS = [0, (ENTER.title[0] + ENTER.title[1]) / 2, ...ENTER.stations, 1];

function viewAt(p: number): View {
  if (p < ENTER.hero[1]) return { phase: 'hero', beat: -1 };
  if (p < ENTER.title[0] - 0.01) return { phase: 'travel', beat: -1 };
  if (p < ENTER.title[1] + 0.012) return { phase: 'title', beat: -1 };
  const beat = ENTER.stations.findIndex((s) => Math.abs(p - s) <= ENTER.half);
  return { phase: 'stations', beat };
}

/** 01 Enter Wieldy + 02 Off-site construction — facility exterior, then the factory floor. */
export function Enter() {
  const ready = useStage((s) => s.ready);
  const setAtStart = useStage((s) => s.setAtStart);
  const [view, setView] = useState<View>({ phase: 'hero', beat: -1 });

  const onProgress = (p: number) => {
    const next = viewAt(p);
    setAtStart(p < ENTER.title[0] - 0.01);
    setView((prev) => (prev.phase === next.phase && prev.beat === next.beat ? prev : next));
  };

  const explore = () => {
    const el = document.getElementById('enter');
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: travel * (ENTER.title[0] + 0.06), behavior: 'smooth' });
  };

  const stations = view.phase === 'stations';
  // Keep the last station highlighted on the rail while travelling to the next.
  const railIndex = view.beat;

  return (
    <Chapter id="enter" length={LENGTH.enter} onProgress={onProgress} stops={STOPS} anchors={[{ id: 'offsite', at: ENTER.title[0] }]}>
      <div className="overlay">
        <div className="overlay__top">
          <Show when={view.phase === 'hero' && ready}>
            <Label>{hero.label}</Label>
          </Show>
          <Show when={view.phase === 'title' || stations} className="overlay__top-right">
            <Label>{offsite.label}</Label>
          </Show>
        </div>

        <div className="overlay__main">
          <Show when={view.phase === 'hero' && ready}>
            <div className="stack">
              <Title as="h1" lines={hero.title} className="title--xl" />
              <p className="body">{hero.body}</p>
              <button type="button" className="btn" onClick={explore}>
                {hero.cta}
                <Arrow down />
              </button>
            </div>
          </Show>

          <Show when={view.phase === 'title'}>
            <div className="stack">
              <Title lines={offsite.title} className="title--xl" />
              <p className="body">{offsite.body}</p>
            </div>
          </Show>

          <Show when={stations}>
            <BeatStack beats={offsite.beats} active={view.beat} />
          </Show>
        </div>

        <div className="overlay__side">
          <Show when={view.phase === 'hero' && ready}>
            <p className="label hero__meta">
              Modular Precast
              <br />
              3×3 · 3×6
            </p>
          </Show>
          <Show when={stations}>
            <Steps labels={offsite.beats.map((b) => b.title)} active={railIndex} />
          </Show>
        </div>
      </div>
    </Chapter>
  );
}
