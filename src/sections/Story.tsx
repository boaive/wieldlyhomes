import { useState } from 'react';
import { story } from '../content/copy';
import { LENGTH, STORY } from '../content/timeline';
import { beatAt } from '../lib/math';
import { BeatStack, Chapter, Label, Steps } from '../ui/Chapter';

const span = (STORY.end - STORY.start) / STORY.count;
const STOPS = Array.from({ length: STORY.count }, (_, i) => STORY.start + (i + 0.72) * span);

/** 04 Construction story — one object, nine stages, ground to habitat. */
export function Story() {
  const [beat, setBeat] = useState(0);

  return (
    <Chapter id="story" length={LENGTH.story} onProgress={(p) => setBeat(beatAt(p, STORY.count, STORY.start, STORY.end))} stops={STOPS}>
      <div className="overlay">
        <div className="overlay__top">
          <Label>{story.label}</Label>
          <Label className="overlay__count">
            {String(beat + 1).padStart(2, '0')} / {String(STORY.count).padStart(2, '0')}
          </Label>
        </div>
        <div className="overlay__main">
          <BeatStack beats={story.beats} active={beat} numeral />
        </div>
        <div className="overlay__side">
          <Steps labels={story.beats.map((b) => b.title)} active={beat} className="steps--compact" />
        </div>
      </div>
    </Chapter>
  );
}
