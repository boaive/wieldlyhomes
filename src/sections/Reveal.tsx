import { useState } from 'react';
import { reveal } from '../content/copy';
import { LENGTH, REVEAL } from '../content/timeline';
import { beatAt } from '../lib/math';
import { BeatStack, Chapter, Label, Show, Steps, Title } from '../ui/Chapter';

const { start, end, count } = REVEAL.layers;
const span = (end - start) / count;
const STOPS = [0, ...Array.from({ length: count }, (_, i) => start + (i + 0.5) * span)];

/** 02 Controlled environment — the finished module, opened in section. */
export function Reveal() {
  const [beat, setBeat] = useState(-1);

  const onProgress = (p: number) => {
    setBeat(p < start ? -1 : beatAt(p, count, start, end));
  };

  return (
    <Chapter id="reveal" length={LENGTH.reveal} onProgress={onProgress} stops={STOPS}>
      <div className="overlay">
        <div className="overlay__top">
          <Label>{reveal.label}</Label>
        </div>
        <div className="overlay__main">
          <Show when={beat === -1}>
            <div className="stack">
              <Title lines={reveal.title} />
              <p className="body">{reveal.body}</p>
            </div>
          </Show>
          <Show when={beat >= 0}>
            <BeatStack beats={reveal.beats} active={beat} />
          </Show>
        </div>
        <div className="overlay__side">
          <Show when={beat >= 0}>
            <Steps labels={reveal.beats.map((b) => b.title)} active={beat} />
          </Show>
        </div>
      </div>
    </Chapter>
  );
}
