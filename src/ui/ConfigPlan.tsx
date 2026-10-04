import { useMemo } from 'react';
import {
  CELL,
  FACE,
  GRID_D,
  GRID_W,
  exposureMask,
  footprint,
  rotationY,
  totals,
  worldCenter,
  type PlacedModule,
  type Slot,
} from '../lib/grid';
import { currentSlots, useConfig } from '../state/config';

/**
 * Live floor plan of the configuration. It is generated from the same module
 * list as the 3D scene, so adding, removing, moving or rotating a module
 * redraws both at once. Connection points are real buttons here too, which
 * makes the configurator fully usable by keyboard and without WebGL.
 */

interface Face {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  glazed: boolean;
  exposed: boolean;
}

/** Wall segments of a module in plan space (metres; x right, z down). */
function facesOf(m: PlacedModule, mask: number): Face[] {
  const [cx, , cz] = worldCenter(m);
  const a = rotationY(m.rot);
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const at = (lx: number, lz: number): [number, number] => [cx + lx * cos + lz * sin, cz - lx * sin + lz * cos];
  const seg = (ax: number, az: number, bx: number, bz: number, glazed: boolean, bit: number): Face => {
    const [x1, y1] = at(ax, az);
    const [x2, y2] = at(bx, bz);
    return { x1, y1, x2, y2, glazed, exposed: (mask & bit) !== 0 };
  };
  if (m.type === 'base') {
    return [
      seg(-1.5, 1.5, 1.5, 1.5, true, FACE.F0),
      seg(-1.5, -1.5, 1.5, -1.5, false, FACE.B0),
      seg(-1.5, -1.5, -1.5, 1.5, false, FACE.L),
      seg(1.5, -1.5, 1.5, 1.5, false, FACE.R),
    ];
  }
  return [
    seg(-3, 1.5, 0, 1.5, true, FACE.F0),
    seg(0, 1.5, 3, 1.5, true, FACE.F1),
    seg(-3, -1.5, 0, -1.5, false, FACE.B0),
    seg(0, -1.5, 3, -1.5, false, FACE.B1),
    seg(-3, -1.5, -3, 1.5, false, FACE.L),
    seg(3, -1.5, 3, 1.5, false, FACE.R),
  ];
}

const rectOf = (m: Pick<PlacedModule, 'type' | 'x' | 'z' | 'rot'>) => {
  const [w, d] = footprint(m.type, m.rot);
  return { x: (m.x - GRID_W / 2) * CELL, y: (m.z - GRID_D / 2) * CELL, width: w * CELL, height: d * CELL };
};

const levelName = (level: number) => (level === 0 ? 'G' : `+${level}`);

export function ConfigPlan({ className }: { className?: string }) {
  const modules = useConfig((s) => s.modules);
  const selectedId = useConfig((s) => s.selectedId);
  const tool = useConfig((s) => s.tool);
  const toolRot = useConfig((s) => s.toolRot);
  const level = useConfig((s) => s.level);
  const busy = useConfig((s) => s.busy);
  const hoverSlot = useConfig((s) => s.hoverSlot);
  const select = useConfig((s) => s.select);
  const applySlot = useConfig((s) => s.applySlot);
  const setHoverSlot = useConfig((s) => s.setHoverSlot);

  const here = useMemo(() => modules.filter((m) => m.level === level), [modules, level]);
  const below = useMemo(() => modules.filter((m) => m.level < level), [modules, level]);
  const faces = useMemo(() => here.map((m) => ({ m, faces: facesOf(m, exposureMask(m, modules)) })), [here, modules]);
  const slots = useMemo<Slot[]>(
    () => (busy ? [] : currentSlots({ modules, selectedId, tool, toolRot, level })),
    [busy, modules, selectedId, tool, toolRot, level],
  );
  const t = useMemo(() => totals(modules), [modules]);

  const W = GRID_W * CELL;
  const D = GRID_D * CELL;
  const pad = 3.2;
  const b = t.bounds;
  const press = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  return (
    <svg
      className={className}
      viewBox={`${-W / 2 - pad} ${-D / 2 - pad} ${W + pad * 2} ${D + pad * 2}`}
      role="group"
      aria-label={`Floor plan of your configuration, level ${levelName(level)}. ${t.count} modules, ${t.areaSqft} square feet.`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 3 m planning grid */}
      <g className="cplan__grid">
        {Array.from({ length: GRID_W + 1 }, (_, i) => (
          <line key={`v${i}`} x1={-W / 2 + i * CELL} y1={-D / 2} x2={-W / 2 + i * CELL} y2={D / 2} />
        ))}
        {Array.from({ length: GRID_D + 1 }, (_, j) => (
          <line key={`h${j}`} x1={-W / 2} y1={-D / 2 + j * CELL} x2={W / 2} y2={-D / 2 + j * CELL} />
        ))}
      </g>

      {/* Levels below, as a dashed underlay */}
      {below.map((m) => (
        <rect key={m.id} className="cplan__below" {...rectOf(m)} />
      ))}

      {faces.map(({ m, faces: list }, i) => {
        const r = rectOf(m);
        const selected = m.id === selectedId;
        const name = `${m.type === 'extended' ? 'Extended' : 'Base'} capsule ${i + 1}`;
        return (
          <g
            key={m.id}
            className={`cplan__module ${selected ? 'is-selected' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`${name}, ${m.type === 'extended' ? '6 by 3' : '3 by 3'} metres${selected ? ', selected' : ''}`}
            onClick={() => select(selected ? null : m.id)}
            onKeyDown={press(() => select(selected ? null : m.id))}
          >
            <rect className="cplan__fill" {...r} />
            {list.map((f, k) =>
              !f.exposed ? (
                <line key={k} className="cplan__joint" x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} />
              ) : f.glazed ? (
                <g key={k} className="cplan__glass">
                  <line x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} />
                  <line x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} />
                </g>
              ) : (
                <line key={k} className="cplan__wall" x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} />
              ),
            )}
            <text className="cplan__tag" x={r.x + r.width / 2} y={r.y + r.height / 2 - 0.1} textAnchor="middle">
              {m.type === 'extended' ? '3×6' : '3×3'}
            </text>
            <text className="cplan__sub" x={r.x + r.width / 2} y={r.y + r.height / 2 + 0.9} textAnchor="middle">
              {m.type === 'extended' ? '200 SQ FT' : '100 SQ FT'}
            </text>
          </g>
        );
      })}

      {/* Connection points */}
      {slots.map((s) => {
        const [x, , y] = worldCenter(s);
        const hovered = hoverSlot === s.key;
        const r = rectOf(s);
        return (
          <g
            key={`${s.key}:${s.rot}:${s.type}`}
            className={`cplan__slot ${hovered ? 'is-hover' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`${selectedId ? 'Move the selected module' : `Place ${s.type} capsule`} at column ${s.x + 1}, row ${s.z + 1}, level ${levelName(s.level)}`}
            onClick={() => applySlot(s)}
            onKeyDown={press(() => applySlot(s))}
            onPointerEnter={() => setHoverSlot(s.key)}
            onPointerLeave={() => setHoverSlot(null)}
            onFocus={() => setHoverSlot(s.key)}
            onBlur={() => setHoverSlot(null)}
          >
            {hovered && <rect className="cplan__ghost" {...r} />}
            <circle cx={x} cy={y} r={1.25} className="cplan__hit" />
            <circle cx={x} cy={y} r={0.5} className="cplan__ring" />
            <path d={`M ${x - 0.26} ${y} H ${x + 0.26} M ${x} ${y - 0.26} V ${y + 0.26}`} className="cplan__plus" />
          </g>
        );
      })}

      {/* Overall dimensions of the footprint */}
      {b && (
        <g className="cplan__dims">
          {(() => {
            const x1 = (b.minX - GRID_W / 2) * CELL;
            const x2 = (b.maxX - GRID_W / 2) * CELL;
            const y1 = (b.minZ - GRID_D / 2) * CELL;
            const y2 = (b.maxZ - GRID_D / 2) * CELL;
            const dy = -D / 2 - 1.4;
            const dx = W / 2 + 1.4;
            return (
              <>
                <path d={`M ${x1} ${dy} H ${x2} M ${x1} ${dy - 0.35} V ${dy + 0.35} M ${x2} ${dy - 0.35} V ${dy + 0.35}`} />
                <text x={(x1 + x2) / 2} y={dy - 0.5} textAnchor="middle">
                  {t.widthM} m
                </text>
                <path d={`M ${dx} ${y1} V ${y2} M ${dx - 0.35} ${y1} H ${dx + 0.35} M ${dx - 0.35} ${y2} H ${dx + 0.35}`} />
                <text x={dx + 0.5} y={(y1 + y2) / 2} dominantBaseline="middle">
                  {t.depthM} m
                </text>
              </>
            );
          })()}
        </g>
      )}

      {!modules.length && (
        <text className="cplan__empty" x={0} y={D / 2 + 1.9} textAnchor="middle">
          SELECT A MODULE TO BEGIN
        </text>
      )}
    </svg>
  );
}
