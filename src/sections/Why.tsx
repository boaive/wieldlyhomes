import { useState } from 'react';
import { ledger, why } from '../content/copy';
import { LENGTH, WHY } from '../content/timeline';
import { beatAt } from '../lib/math';
import { BeatStack, Chapter, Label, Show, Steps, Title } from '../ui/Chapter';

const span = (WHY.end - WHY.start) / WHY.count;
const STOPS = Array.from({ length: WHY.count }, (_, i) => WHY.start + (i + 0.5) * span);

/** 03 Why Wieldy — six advantages, each demonstrated on the module itself. */
export function Why() {
  const [beat, setBeat] = useState(-1);

  const onProgress = (p: number) => {
    setBeat(p < WHY.start * 0.6 ? -1 : beatAt(p, WHY.count, WHY.start, WHY.end));
  };

  return (
    <Chapter id="why" length={LENGTH.why} onProgress={onProgress} stops={STOPS}>
      <div className="overlay">
        <div className="overlay__top">
          <Label>{why.label}</Label>
        </div>
        <div className="overlay__main">
          <Show when={beat === -1}>
            <Title lines={why.title} />
          </Show>
          <Show when={beat >= 0}>
            <BeatStack beats={why.beats} active={beat} />
          </Show>
        </div>
        <div className="overlay__side">
          <Show when={beat >= 0}>
            <Steps labels={why.beats.map((b) => b.title)} active={beat} />
          </Show>
        </div>
      </div>
    </Chapter>
  );
}

/** The system compared with traditional precast, plus the principles from the client brief. */
export function Ledger() {
  return (
    <Chapter id="ledger" className="paper on-paper">
      <div className="paper__inner">
        <header className="paper__head">
          <Label>{ledger.label}</Label>
          <Title lines={ledger.title} className="title--m" />
        </header>

        <dl className="figures">
          {ledger.figures.map((f) => (
            <div key={f.label} className="figure">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
          <div className="figure figure--marks">
            <dt>Also</dt>
            <dd>
              {ledger.marks.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </dd>
          </div>
        </dl>

        <table className="compare">
          <caption className="sr-only">Wieldy Homes system compared with traditional precast concrete</caption>
          <thead>
            <tr>
              <th scope="col">{ledger.compare.ours}</th>
              <th scope="col">{ledger.compare.theirs}</th>
            </tr>
          </thead>
          <tbody>
            {ledger.compare.rows.map(([ours, theirs]) => (
              <tr key={ours}>
                <td>{ours}</td>
                <td>{theirs}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ol className="principles">
          {ledger.principles.map((p, i) => (
            <li key={p.title}>
              <span className="label">{String(i + 1).padStart(2, '0')}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Chapter>
  );
}
