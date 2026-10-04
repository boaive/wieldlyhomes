import { useMemo, useRef } from 'react';
import { configure as copy, precast } from '../content/copy';
import { PLAN_GROUPS } from '../content/plans';
import { MAX_LEVELS, MAX_MODULES, totals, type ModuleType } from '../lib/grid';
import { clamp } from '../lib/math';
import { configView, useConfig } from '../state/config';
import { useEnquiry } from '../state/enquiry';
import { useStage } from '../state/stage';
import { Arrow } from '../ui/Arrow';
import { Chapter, Label, Title } from '../ui/Chapter';
import { ConfigPlan } from '../ui/ConfigPlan';
import { goTo } from '../ui/Nav';

const levelName = (level: number) => (level === 0 ? 'Ground' : `Level ${level}`);
const FACING = ['Front', 'Right', 'Back', 'Left'];

/** 06 Configure — pick a capsule, place it on the grid, watch the plan follow. */
export function Configure() {
  const webgl = useStage((s) => s.webgl);
  const modules = useConfig((s) => s.modules);
  const selectedId = useConfig((s) => s.selectedId);
  const tool = useConfig((s) => s.tool);
  const toolRot = useConfig((s) => s.toolRot);
  const level = useConfig((s) => s.level);
  const busy = useConfig((s) => s.busy) > 0;
  const notice = useConfig((s) => s.notice);
  const { setTool, setLevel, addRecommended, rotate, remove, reset, load } = useConfig.getState();
  const setPath = useEnquiry((s) => s.setPath);
  const setWithConfiguration = useEnquiry((s) => s.setWithConfiguration);

  const t = useMemo(() => totals(modules), [modules]);
  const selected = modules.find((m) => m.id === selectedId) ?? null;
  const topLevel = Math.min(MAX_LEVELS - 1, t.storeys);
  const full = modules.length >= MAX_MODULES;

  const pick = (type: ModuleType) => {
    setTool(type);
    // The first module goes straight to the centre of the grid.
    if (!useConfig.getState().modules.length) addRecommended();
  };

  // Horizontal drag turns the view; vertical movement is left to page scroll.
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, yaw: configView.yaw };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    configView.yaw = clamp(drag.current.yaw - (e.clientX - drag.current.x) * 0.006, configView.min, configView.max);
  };
  const endDrag = () => {
    drag.current = null;
  };

  const quote = () => {
    setPath('project');
    setWithConfiguration(true);
    goTo('#contact');
  };

  const rotation = selected ? selected.rot : toolRot;
  const hint = webgl ? 'Drag to turn the view · Tap a point to place · Tap a module to select' : 'Tap a point on the plan to place · Tap a module to select';

  return (
    <Chapter id="configure" length={300}>
      <div className="configure">
        <div
          className="configure__view"
          data-viewport="config"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          <header className="configure__head">
            <Label>{copy.label}</Label>
            <Title lines={copy.title} className="title--s" />
            <p className="body">{copy.body}</p>
          </header>
        </div>

        <div className="configure__controls" aria-label="Configurator controls">
          <fieldset className="tools">
            <legend className="label">Modules</legend>
            {precast.modules.map((m) => (
              <button key={m.id} type="button" className={`tool ${tool === m.id && !selected ? 'is-on' : ''}`} aria-pressed={tool === m.id && !selected} disabled={busy} onClick={() => pick(m.id)}>
                <span className={`tool__glyph tool__glyph--${m.id}`} aria-hidden="true" />
                <strong>{m.short}</strong>
                <span>
                  {m.name} · {m.area}
                </span>
              </button>
            ))}
          </fieldset>

          <fieldset className="level">
            <legend className="label">Level</legend>
            <button type="button" className="btn btn--quiet" aria-label="Lower level" disabled={busy || level === 0} onClick={() => setLevel(level - 1)}>
              −
            </button>
            <output aria-live="polite">{levelName(level)}</output>
            <button type="button" className="btn btn--quiet" aria-label="Upper level" disabled={busy || level >= topLevel} onClick={() => setLevel(level + 1)}>
              +
            </button>
          </fieldset>

          <fieldset className="actions">
            <legend className="label">Configuration</legend>
            <button type="button" className="btn btn--solid" disabled={busy || full} onClick={addRecommended}>
              + Add module
            </button>
            <button type="button" className="btn" disabled={busy} onClick={rotate}>
              Rotate · {FACING[rotation]}
            </button>
            <button type="button" className="btn" disabled={busy || !selected} onClick={remove}>
              Remove
            </button>
            <button type="button" className="btn" disabled={busy || !modules.length} onClick={reset}>
              Reset
            </button>
          </fieldset>

          <p className="configure__notice" role="status" aria-live="polite">
            {notice ?? (selected ? 'Module selected — pick a point to move it, or rotate / remove it.' : hint)}
          </p>
        </div>

        <aside className="configure__plan sheet on-paper" aria-label="Floor plan">
          <div className="sheet__head">
            <span className="label">Plan · {levelName(level)}</span>
            <span className="label">Glazed front shown as a double line</span>
          </div>
          <ConfigPlan className="sheet__drawing" />
          <div className="presets">
            <span className="label">Catalogue layouts</span>
            {PLAN_GROUPS.map((g) => (
              <button key={g.area} type="button" disabled={busy} onClick={() => load(g.modules)} aria-label={`Load the ${g.area} square foot catalogue layout`}>
                {g.area}
              </button>
            ))}
          </div>
          <dl className="summary">
            <div>
              <dt className="label">Modules</dt>
              <dd>{t.count}</dd>
            </div>
            <div>
              <dt className="label">Area</dt>
              <dd>{t.areaSqft} sq ft</dd>
            </div>
            <div>
              <dt className="label">Storeys</dt>
              <dd>{t.storeys}</dd>
            </div>
            <div>
              <dt className="label">Footprint</dt>
              <dd>{t.count ? `${t.widthM} × ${t.depthM} m` : '—'}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn--solid" disabled={!modules.length} onClick={quote}>
            Request a quote
            <Arrow />
          </button>
        </aside>
      </div>
    </Chapter>
  );
}
