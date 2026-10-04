import { useStage, type ChapterId } from '../state/stage';
import { goTo } from './Nav';

/** The eleven steps of the narrative and the chapter each one starts at. */
const STEPS: { label: string; href: string; chapters: ChapterId[] }[] = [
  { label: 'Enter Wieldy', href: '#enter', chapters: [] },
  { label: 'Off-site construction', href: '#offsite', chapters: ['enter', 'reveal'] },
  { label: 'Why Wieldy', href: '#why', chapters: ['why', 'ledger'] },
  { label: 'Construction story', href: '#story', chapters: ['story'] },
  { label: 'Modular Precast', href: '#precast', chapters: ['precast', 'plans'] },
  { label: 'Configure', href: '#configure', chapters: ['configure'] },
  { label: 'Transport · Site · Installation', href: '#journey', chapters: ['journey'] },
  { label: 'Interior', href: '#habitat', chapters: ['habitat'] },
  { label: 'Labour Precamp', href: '#precamp', chapters: ['precamp'] },
  { label: 'Capsule House', href: '#capsule', chapters: ['capsule'] },
  { label: 'Contact', href: '#contact', chapters: ['contact'] },
];

/** Thin index of the eleven chapters, fixed to the right edge on desktop. */
export function Rail() {
  const chapter = useStage((s) => s.chapter);
  const atStart = useStage((s) => s.atStart);
  const ready = useStage((s) => s.ready);
  const current = chapter === 'enter' && atStart ? 0 : STEPS.findIndex((s) => s.chapters.includes(chapter));

  return (
    <nav className={`rail ${ready ? '' : 'is-hidden'} ${chapter === 'ledger' ? 'rail--ink' : ''}`} aria-label="Chapters">
      {STEPS.map((step, i) => (
        <a
          key={step.href}
          href={step.href}
          className={i === current ? 'is-current' : ''}
          aria-current={i === current ? 'step' : undefined}
          onClick={(e) => {
            e.preventDefault();
            goTo(step.href);
          }}
        >
          <span>
            {String(i + 1).padStart(2, '0')} · {step.label}
          </span>
        </a>
      ))}
    </nav>
  );
}
