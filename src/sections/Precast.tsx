import { useState } from 'react';
import { precast } from '../content/copy';
import { LENGTH, PRECAST } from '../content/timeline';
import { beatAt } from '../lib/math';
import { BeatStack, Chapter, Label, Show, Title } from '../ui/Chapter';

const span = (PRECAST.end - PRECAST.start) / PRECAST.count;
const STOPS = [0, ...Array.from({ length: PRECAST.count }, (_, i) => PRECAST.start + (i + 0.6) * span)];

/** 05 Modular Precast — the two capsules as physical objects. */
export function Precast() {
  const [beat, setBeat] = useState(-1);

  const onProgress = (p: number) => {
    setBeat(p < PRECAST.title[1] ? -1 : beatAt(p, PRECAST.count, PRECAST.start, PRECAST.end));
  };

  return (
    <Chapter id="precast" length={LENGTH.precast} onProgress={onProgress} stops={STOPS}>
      <div className="overlay">
        <div className="overlay__top">
          <Label>{precast.label}</Label>
        </div>

        <div className="overlay__main">
          <Show when={beat === -1}>
            <div className="stack">
              <Title lines={precast.title} />
              <p className="body">{precast.body}</p>
              <dl className="module-specs">
                {precast.modules.map((m) => (
                  <div key={m.id}>
                    <dt className="label">{m.name}</dt>
                    <dd>
                      <strong>{m.area}</strong>
                      <span>{m.footprint}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Show>

          <Show when={beat >= 0}>
            <div className="stack">
              <BeatStack beats={precast.beats} active={beat} />
              <Show when={beat === 2} className="footprints-wrap">
                <dl className="footprints">
                  {precast.footprints.map((f) => (
                    <div key={f.name}>
                      <dt className="label">{f.name}</dt>
                      <dd>
                        <strong>{f.sqm}</strong>
                        <span>{f.sqft}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </Chapter>
  );
}
