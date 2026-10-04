import { PLAN_GROUPS } from '../content/plans';
import { plansCopy, precast } from '../content/copy';
import { useConfig } from '../state/config';
import { groupFor, usePlans } from '../state/plans';
import { Arrow } from '../ui/Arrow';
import { Chapter, Label, Title } from '../ui/Chapter';
import { goTo } from '../ui/Nav';
import { PlanDrawing } from '../ui/PlanDrawing';

/** 05 Layouts — catalogue floor plans beside their capsule arrangement. */
export function Plans() {
  const area = usePlans((s) => s.area);
  const option = usePlans((s) => s.option);
  const setArea = usePlans((s) => s.setArea);
  const setOption = usePlans((s) => s.setOption);
  const load = useConfig((s) => s.load);
  const busy = useConfig((s) => s.busy);

  const group = groupFor(area);
  const plan = group.plans.find((p) => p.option === option) ?? group.plans[0];

  const configure = () => {
    load(group.modules);
    goTo('#configure');
  };

  return (
    <Chapter id="plans" length={250}>
      <div className="plans">
        <header className="plans__head">
          <Label>{plansCopy.label}</Label>
          <Title lines={plansCopy.title} className="title--m" />
          <p className="body">{plansCopy.body}</p>
        </header>

        <div className="plans__select">
          <div className="sizes" role="tablist" aria-label="Layout size">
            {PLAN_GROUPS.map((g) => (
              <button key={g.area} type="button" role="tab" aria-selected={g.area === area} className={g.area === area ? 'is-on' : ''} onClick={() => setArea(g.area)}>
                <strong>{g.area}</strong>
                <span>sq ft</span>
              </button>
            ))}
          </div>

          <div className="options" role="tablist" aria-label="Layout option">
            {group.plans.map((p) => (
              <button key={p.id} type="button" role="tab" aria-selected={p.option === plan.option} className={p.option === plan.option ? 'is-on' : ''} onClick={() => setOption(p.option)}>
                Option {p.option}
              </button>
            ))}
          </div>

          <dl className="plans__facts">
            <div>
              <dt className="label">Footprint</dt>
              <dd>{plan.footprint}</dd>
            </div>
            <div>
              <dt className="label">Capsules</dt>
              <dd>
                {group.modules.map((m) => (m.type === 'extended' ? '3×6' : '3×3')).join(' + ')} · {group.sqm}
              </dd>
            </div>
            <div>
              <dt className="label">Catalogue elevation</dt>
              <dd>{group.elevation}</dd>
            </div>
          </dl>

          <button type="button" className="btn" onClick={configure} disabled={busy > 0}>
            {plansCopy.cta}
            <Arrow />
          </button>
        </div>

        <figure className="sheet on-paper" aria-live="polite">
          <figcaption className="sheet__head">
            <span className="label">
              Plan · {plan.area} sq ft · Option {plan.option}
            </span>
            <span className="label">{plan.rooms.join(' · ')}</span>
          </figcaption>
          <PlanDrawing key={plan.id} plan={plan} className="sheet__drawing" />
          <p className="sheet__note">{plansCopy.note}</p>
        </figure>

        <p className="plans__uses label">
          <span>One system</span>
          {precast.applications.join(' · ')}
        </p>
      </div>
    </Chapter>
  );
}
