import { useId, type ReactNode } from 'react';
import type { Door, Fixture, PlanDef, Seg, Zone } from '../content/plans';

/**
 * Architectural floor plan, drawn as SVG from plan data: poché walls, door
 * swings, glazing, fixtures, hatched decks and overall dimensions.
 * Units are feet; the drawing scales to its container.
 */

const INK = 'var(--ink)';
const PAPER = 'var(--paper, #f1eee5)';

function Opening({ door, k }: { door: Door; k: number }) {
  const [hx, hy] = door.at;
  const [jx, jy] = door.to;
  const width = Math.hypot(jx - hx, jy - hy);
  const gap = <line x1={hx} y1={hy} x2={jx} y2={jy} stroke={PAPER} strokeWidth={0.78 * k} />;
  if (!door.into) {
    return (
      <g>
        {gap}
        <line x1={hx} y1={hy} x2={jx} y2={jy} stroke={INK} strokeWidth={0.05 * k} strokeDasharray={`${0.3 * k} ${0.22 * k}`} opacity={0.55} />
      </g>
    );
  }
  const lx = hx + door.into[0] * width;
  const ly = hy + door.into[1] * width;
  // Sweep direction of the quarter arc from the open leaf back to the far jamb.
  const cross = (lx - hx) * (jy - hy) - (ly - hy) * (jx - hx);
  return (
    <g>
      {gap}
      <line x1={hx} y1={hy} x2={lx} y2={ly} stroke={INK} strokeWidth={0.09 * k} />
      <path d={`M ${lx} ${ly} A ${width} ${width} 0 0 ${cross > 0 ? 1 : 0} ${jx} ${jy}`} fill="none" stroke={INK} strokeWidth={0.045 * k} opacity={0.5} />
    </g>
  );
}

function Glazing({ seg, k }: { seg: Seg; k: number }) {
  const [x1, y1, x2, y2] = seg;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = (-(y2 - y1) / len) * 0.17 * k;
  const ny = ((x2 - x1) / len) * 0.17 * k;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PAPER} strokeWidth={0.7 * k} />
      {[-1, 0, 1].map((o) => (
        <line key={o} x1={x1 + nx * o} y1={y1 + ny * o} x2={x2 + nx * o} y2={y2 + ny * o} stroke={INK} strokeWidth={0.045 * k} />
      ))}
    </g>
  );
}

function Area({ zone, k, ids }: { zone: Zone; k: number; ids: { hatch: string; dots: string } }) {
  const [x, y, w, h] = zone.rect;
  if (zone.kind === 'steps') {
    const horizontal = w >= h;
    const count = 3;
    const lines: ReactNode[] = [];
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      lines.push(
        horizontal ? (
          <line key={i} x1={x + w * t} y1={y} x2={x + w * t} y2={y + h} stroke={INK} strokeWidth={0.04 * k} opacity={0.6} />
        ) : (
          <line key={i} x1={x} y1={y + h * t} x2={x + w} y2={y + h * t} stroke={INK} strokeWidth={0.04 * k} opacity={0.6} />
        ),
      );
    }
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={0.05 * k} opacity={0.6} />
        {lines}
      </g>
    );
  }
  if (zone.kind === 'court') {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${ids.dots})`} opacity={0.5} />
        <rect x={x + w * 0.2} y={y + h * 0.3} width={w * 0.6} height={h * 0.7} fill="none" stroke={INK} strokeWidth={0.05 * k} strokeDasharray={`${0.4 * k} ${0.25 * k}`} opacity={0.6} />
      </g>
    );
  }
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={`url(#${zone.kind === 'deck' ? ids.hatch : ids.dots})`}
      stroke={INK}
      strokeWidth={0.05 * k}
      strokeOpacity={0.5}
    />
  );
}

function Fitting({ f, k }: { f: Fixture; k: number }) {
  const [x, y, w, h] = f.rect;
  const s = { fill: PAPER, stroke: INK, strokeWidth: 0.055 * k, opacity: 0.62 };
  const thin = { fill: 'none', stroke: INK, strokeWidth: 0.04 * k, opacity: 0.5 };
  switch (f.kind) {
    case 'bed': {
      const side = f.side ?? 'n';
      const pillow =
        side === 'w' ? (
          <>
            <rect x={x + 0.25} y={y + 0.35} width={1.1} height={h / 2 - 0.5} rx={0.15} {...thin} />
            <rect x={x + 0.25} y={y + h / 2 + 0.15} width={1.1} height={h / 2 - 0.5} rx={0.15} {...thin} />
            <line x1={x + 2} y1={y} x2={x + 2} y2={y + h} {...thin} />
          </>
        ) : side === 'e' ? (
          <>
            <rect x={x + w - 1.35} y={y + 0.35} width={1.1} height={h / 2 - 0.5} rx={0.15} {...thin} />
            <rect x={x + w - 1.35} y={y + h / 2 + 0.15} width={1.1} height={h / 2 - 0.5} rx={0.15} {...thin} />
            <line x1={x + w - 2} y1={y} x2={x + w - 2} y2={y + h} {...thin} />
          </>
        ) : (
          <>
            <rect x={x + 0.35} y={y + 0.25} width={w / 2 - 0.5} height={1.1} rx={0.15} {...thin} />
            <rect x={x + w / 2 + 0.15} y={y + 0.25} width={w / 2 - 0.5} height={1.1} rx={0.15} {...thin} />
            <line x1={x} y1={y + 2} x2={x + w} y2={y + 2} {...thin} />
          </>
        );
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={0.12} {...s} />
          {pillow}
        </g>
      );
    }
    case 'wc': {
      const side = f.side ?? 'n';
      const vertical = side === 'n' || side === 's';
      const tank = vertical
        ? { x, y: side === 'n' ? y : y + h - 0.6, width: w, height: 0.6 }
        : { x: side === 'w' ? x : x + w - 0.6, y, width: 0.6, height: h };
      const bowl = vertical
        ? { cx: x + w / 2, cy: side === 'n' ? y + 0.6 + (h - 0.6) / 2 : y + (h - 0.6) / 2, rx: w * 0.36, ry: (h - 0.6) / 2 }
        : { cx: side === 'w' ? x + 0.6 + (w - 0.6) / 2 : x + (w - 0.6) / 2, cy: y + h / 2, rx: (w - 0.6) / 2, ry: h * 0.36 };
      return (
        <g>
          <rect {...tank} rx={0.1} {...s} />
          <ellipse {...bowl} {...s} />
        </g>
      );
    }
    case 'basin':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={0.12} {...s} />
          <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.3} ry={h * 0.28} {...thin} />
        </g>
      );
    case 'shower':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} {...thin} />
          <line x1={x} y1={y} x2={x + w} y2={y + h} {...thin} />
          <circle cx={x + 0.55} cy={y + 0.55} r={0.2} {...thin} />
        </g>
      );
    case 'sofa': {
      const side = f.side ?? 'n';
      const back =
        side === 'n' ? { x, y, width: w, height: 0.5 } : side === 's' ? { x, y: y + h - 0.5, width: w, height: 0.5 } : side === 'w' ? { x, y, width: 0.5, height: h } : { x: x + w - 0.5, y, width: 0.5, height: h };
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={0.18} {...s} />
          <rect {...back} rx={0.12} {...thin} />
        </g>
      );
    }
    case 'counter':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} {...s} />
          <rect x={x + 0.4} y={y + 0.25} width={Math.min(1.5, w * 0.3)} height={h - 0.5} rx={0.1} {...thin} />
        </g>
      );
    case 'wardrobe': {
      const lines: ReactNode[] = [];
      const horizontal = w >= h;
      const n = Math.max(3, Math.round((horizontal ? w : h) / 0.7));
      for (let i = 1; i < n; i++) {
        lines.push(
          horizontal ? (
            <line key={i} x1={x + (w * i) / n - 0.15} y1={y + 0.2} x2={x + (w * i) / n + 0.15} y2={y + h - 0.2} {...thin} />
          ) : (
            <line key={i} x1={x + 0.2} y1={y + (h * i) / n - 0.15} x2={x + w - 0.2} y2={y + (h * i) / n + 0.15} {...thin} />
          ),
        );
      }
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} {...s} />
          {lines}
        </g>
      );
    }
    case 'desk':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} {...s} />
          <circle cx={x + w / 2} cy={f.side === 'n' ? y - 0.75 : y + h + 0.75} r={0.55} {...thin} />
        </g>
      );
    default:
      return <rect x={x} y={y} width={w} height={h} rx={0.1} {...s} />;
  }
}

interface PlanDrawingProps {
  plan: PlanDef;
  className?: string;
}

export function PlanDrawing({ plan, className }: PlanDrawingProps) {
  const uid = useId().replace(/:/g, '');
  const ids = { hatch: `hatch-${uid}`, dots: `dots-${uid}` };
  const [w, h] = plan.size;
  /** Line-weight and type scale, relative to the longest side. */
  const k = Math.max(w, h) / 20;
  /** Type scales more gently than line weight so large plans stay legible. */
  const kt = Math.min(k, 1.3);

  // Extents, including decks and steps outside the walls.
  let minX = 0;
  let minY = 0;
  let maxX = w;
  let maxY = h;
  for (const z of plan.zones) {
    minX = Math.min(minX, z.rect[0]);
    minY = Math.min(minY, z.rect[1]);
    maxX = Math.max(maxX, z.rect[0] + z.rect[2]);
    maxY = Math.max(maxY, z.rect[1] + z.rect[3]);
  }
  const pad = 2.6 * k;
  const padRight = 3.6 * k;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad + padRight} ${maxY - minY + pad * 2}`;
  const outline = plan.outline.map(([x, y]) => `${x},${y}`).join(' ');
  const tick = 0.32 * k;
  const dimY = minY - 1.5 * k;
  const dimX = maxX + 1.5 * k;
  const type = { fontFamily: 'var(--font-mono)', fill: INK };

  return (
    <svg
      className={className}
      viewBox={vb}
      role="img"
      aria-label={`Floor plan, ${plan.area} sq ft option ${plan.option}: ${plan.rooms.join(', ')}. ${plan.footprint}.`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id={ids.hatch} width={0.5 * k} height={0.5 * k} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={0.5 * k} stroke={INK} strokeWidth={0.05 * k} opacity="0.42" />
        </pattern>
        <pattern id={ids.dots} width={0.62 * k} height={0.62 * k} patternUnits="userSpaceOnUse">
          <circle cx={0.31 * k} cy={0.31 * k} r={0.055 * k} fill={INK} opacity="0.4" />
        </pattern>
      </defs>

      {plan.zones.map((z, i) => (
        <Area key={i} zone={z} k={k} ids={ids} />
      ))}

      {plan.fixtures.map((f, i) => (
        <Fitting key={i} f={f} k={k} />
      ))}

      {plan.partitions.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={0.26 * k} strokeLinecap="square" />
      ))}
      <polygon points={outline} fill="none" stroke={INK} strokeWidth={0.5 * k} strokeLinejoin="miter" />

      {plan.windows.map((s, i) => (
        <Glazing key={i} seg={s} k={k} />
      ))}
      {plan.doors.map((d, i) => (
        <Opening key={i} door={d} k={k} />
      ))}

      {plan.zones
        .filter((z) => z.label)
        .map((z) => (
          <text key={z.label} y={z.rect[1] + z.rect[3] / 2 - (z.label!.includes(' / ') ? 0.3 * kt : 0)} textAnchor="middle" fontSize={0.48 * kt} letterSpacing={0.05 * kt} opacity={0.7} {...type}>
            {z.label!.split(' / ').map((line, i) => (
              <tspan key={line} x={z.rect[0] + z.rect[2] / 2} dy={i ? 0.78 * kt : 0}>
                {line.toUpperCase()}
              </tspan>
            ))}
          </text>
        ))}

      {plan.labels.map((l, i) => (
        <text key={i} x={l.at[0]} y={l.at[1]} textAnchor="middle" {...type}>
          <tspan fontSize={0.6 * kt} fontWeight={500} letterSpacing={0.07 * kt}>
            {l.text.toUpperCase()}
          </tspan>
          {l.sub && (
            <tspan x={l.at[0]} dy={0.8 * kt} fontSize={0.46 * kt} opacity={0.62}>
              {l.sub}
            </tspan>
          )}
        </text>
      ))}

      {/* Overall dimensions */}
      <g stroke={INK} strokeWidth={0.04 * k} opacity={0.75}>
        <line x1={0} y1={dimY} x2={w} y2={dimY} />
        <line x1={0} y1={dimY - tick} x2={0} y2={dimY + tick} />
        <line x1={w} y1={dimY - tick} x2={w} y2={dimY + tick} />
        <line x1={dimX} y1={0} x2={dimX} y2={h} />
        <line x1={dimX - tick} y1={0} x2={dimX + tick} y2={0} />
        <line x1={dimX - tick} y1={h} x2={dimX + tick} y2={h} />
      </g>
      <text x={w / 2} y={dimY - 0.35 * k} textAnchor="middle" fontSize={0.56 * k} {...type}>
        {w}′
      </text>
      <text x={dimX + 0.4 * k} y={h / 2} fontSize={0.56 * k} dominantBaseline="middle" {...type}>
        {h}′
      </text>
    </svg>
  );
}
