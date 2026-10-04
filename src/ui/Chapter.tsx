import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scroll, useStage, type ChapterId } from '../state/stage';
import type { Beat as BeatData } from '../content/copy';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

interface ChapterProps {
  id: ChapterId;
  /**
   * Height in viewport heights. When set, the chapter is a tall scroll track
   * with a sticky full-screen stage; when omitted, it is a normal flowing section.
   */
  length?: number;
  /** Called with 0→1 progress on scroll. Keep it cheap — set state only on change. */
  onProgress?: (p: number) => void;
  /**
   * Progress values to hold at when reduced motion is requested: the chapter
   * then steps between static states instead of scrubbing.
   */
  stops?: readonly number[];
  className?: string;
  /** Extra in-page anchors, positioned at a fraction of the chapter's length. */
  anchors?: { id: string; at: number }[];
  children: ReactNode;
}

const nearestStop = (p: number, stops: readonly number[]) => {
  let best = stops[0];
  for (const s of stops) if (Math.abs(s - p) < Math.abs(best - p)) best = s;
  return best;
};

/**
 * A chapter of the page. It reports its scroll progress to the shared stage
 * state, which is what the 3D director reads.
 */
export function Chapter({ id, length, onProgress, stops, className = '', anchors, children }: ChapterProps) {
  const ref = useRef<HTMLElement>(null);
  const setChapter = useStage((s) => s.setChapter);
  const reduced = useStage((s) => s.reducedMotion);
  const callback = useRef(onProgress);
  callback.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sticky = length !== undefined;

    const report = (raw: number) => {
      const p = reduced && stops ? nearestStop(raw, stops) : raw;
      if (scroll.p[id] === p) return;
      scroll.p[id] = p;
      callback.current?.(p);
    };

    const active = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => self.isActive && setChapter(id),
      onUpdate: sticky ? undefined : (self) => report(self.progress),
      onRefresh: (self) => {
        scroll.start[id] = self.start;
        scroll.end[id] = self.end;
        if (self.isActive) setChapter(id);
      },
    });
    const travel = sticky
      ? ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => report(self.progress),
          onRefresh: (self) => report(self.progress),
        })
      : null;

    callback.current?.(scroll.p[id]);
    return () => {
      active.kill();
      travel?.kill();
    };
  }, [id, length, reduced, setChapter, stops]);

  const style = length !== undefined ? ({ '--length': length } as CSSProperties) : undefined;

  return (
    <section ref={ref} id={id} className={`chapter ${length !== undefined ? 'chapter--sticky' : 'chapter--flow'} ${className}`} style={style}>
      {anchors?.map((a) => <span key={a.id} id={a.id} className="chapter__anchor" style={{ top: `${a.at * 100}%` }} />)}
      {length !== undefined ? <div className="chapter__stage">{children}</div> : children}
    </section>
  );
}

/** Small technical label: "02 / Off-site construction". */
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`label ${className}`}>{children}</p>;
}

/** Multi-line display title. Each line is its own block so breaks are deliberate. */
export function Title({ lines, as: Tag = 'h2', className = '' }: { lines: readonly string[]; as?: 'h1' | 'h2' | 'h3'; className?: string }) {
  return (
    <Tag className={`title ${className}`}>
      {lines.map((line) => (
        <span key={line} className="title__line">
          {line}{' '}
        </span>
      ))}
    </Tag>
  );
}

/** Something that fades in and out with the scroll state. */
export function Show({ when, children, className = '' }: { when: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`show ${when ? 'is-on' : ''} ${className}`} aria-hidden={!when} inert={!when}>
      {children}
    </div>
  );
}

interface BeatStackProps {
  beats: readonly BeatData[];
  /** Index of the visible beat, or -1 for none. */
  active: number;
  /** Render the index as a large numeral above the title. */
  numeral?: boolean;
  className?: string;
}

/** A stack of text beats occupying the same space; one is visible at a time. */
export function BeatStack({ beats, active, numeral = false, className = '' }: BeatStackProps) {
  return (
    <div className={`beats ${className}`}>
      {beats.map((beat, i) => (
        <article key={beat.index} className={`beat ${i === active ? 'is-on' : ''}`} aria-hidden={i !== active}>
          {numeral ? <p className="beat__numeral">{beat.index}</p> : <p className="beat__index label">{beat.index}</p>}
          <h3 className="beat__title">{beat.title}</h3>
          <p className="beat__body">{beat.body}</p>
          {beat.items && beat.items.length > 1 && (
            <ul className="beat__items">
              {beat.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

/** Row of ticks showing position within a set of beats. */
export function Steps({ labels, active, className = '' }: { labels: readonly string[]; active: number; className?: string }) {
  return (
    <ol className={`steps ${className}`} aria-hidden="true">
      {labels.map((label, i) => (
        <li key={label} className={i === active ? 'is-on' : i < active ? 'is-done' : ''}>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
