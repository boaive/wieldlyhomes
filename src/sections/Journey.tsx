import { useMemo, useState } from 'react';
import { habitat, journey } from '../content/copy';
import { HABITAT, JOURNEY_BEATS, LENGTH } from '../content/timeline';
import { describe } from '../lib/grid';
import { beatAt } from '../lib/math';
import { shippedModules, useConfig } from '../state/config';
import { BeatStack, Chapter, Label, Show, Steps, Title } from '../ui/Chapter';

const journeyBeat = (p: number) => {
  for (let i = JOURNEY_BEATS.length - 2; i >= 0; i--) if (p >= JOURNEY_BEATS[i]) return i;
  return 0;
};

const JOURNEY_STOPS = [0.2, 0.38, 0.52, 0.8, 0.99];

/** 07 Transport → Site → Installation — the visitor's own configuration becomes a building. */
export function Journey() {
  const [beat, setBeat] = useState(0);
  const modules = useConfig((s) => s.modules);
  const own = modules.length > 0;
  const summary = useMemo(() => describe(shippedModules(modules)), [modules]);

  return (
    <Chapter id="journey" length={LENGTH.journey} onProgress={(p) => setBeat(journeyBeat(p))} stops={JOURNEY_STOPS}>
      <div className="overlay">
        <div className="overlay__top">
          <Label>{journey.label}</Label>
          <div className="shipment">
            <Label className="label--lime">{own ? 'Your configuration' : 'Sample configuration'}</Label>
            <p>{summary}</p>
          </div>
        </div>
        <div className="overlay__main">
          <BeatStack beats={journey.beats} active={beat} />
        </div>
        <div className="overlay__side">
          <Steps labels={journey.beats.map((b) => b.title)} active={beat} />
        </div>
      </div>
    </Chapter>
  );
}

const span = (HABITAT.end - HABITAT.start) / HABITAT.count;
const HABITAT_STOPS = [0, ...Array.from({ length: HABITAT.count }, (_, i) => HABITAT.start + (i + 0.5) * span)];

/** 08 Interior — a walk through the finished space. */
export function Habitat() {
  const [beat, setBeat] = useState(-1);

  return (
    <Chapter id="habitat" length={LENGTH.habitat} onProgress={(p) => setBeat(p < HABITAT.start ? -1 : beatAt(p, HABITAT.count, HABITAT.start, HABITAT.end))} stops={HABITAT_STOPS}>
      <div className="overlay">
        <div className="overlay__top">
          <Label>{habitat.label}</Label>
        </div>
        <div className="overlay__main">
          <Show when={beat === -1}>
            <Title lines={habitat.title} />
          </Show>
          <Show when={beat >= 0}>
            <BeatStack beats={habitat.beats} active={beat} />
          </Show>
        </div>
        <div className="overlay__side">
          <Show when={beat >= 0}>
            <Steps labels={habitat.beats.map((b) => b.title)} active={beat} />
          </Show>
        </div>
      </div>
    </Chapter>
  );
}
