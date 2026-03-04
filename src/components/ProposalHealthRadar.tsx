'use client';

const AXES = [
  'Técnico',
  'Financeiro',
  'Impacto',
  'Equipe',
  'Sustentabilidade',
  'Inovação',
  'Risco',
] as const;

type AxisKey = (typeof AXES)[number];

interface Props {
  scores: Partial<Record<AxisKey, number>>;
}

const CX = 150;
const CY = 150;
const R = 90;
const N = AXES.length;
const GRID_LEVELS = [25, 50, 75, 100];

/* Angle for axis i — start at top (−π/2), clockwise */
function axisAngle(i: number): number {
  return (2 * Math.PI * i) / N - Math.PI / 2;
}

/* Cartesian point for a given axis index and value (0-100) */
function polarToXY(i: number, value: number): [number, number] {
  const angle = axisAngle(i);
  const r = (value / 100) * R;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

/* Polygon points string from an array of [x, y] */
function toPoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(' ');
}

/* Label anchor and offset so text doesn't overlap the polygon */
function labelProps(i: number): {
  x: number;
  y: number;
  textAnchor: 'start' | 'middle' | 'end';
  dy: string;
} {
  const angle = axisAngle(i);
  const labelR = R + 22;
  const x = CX + labelR * Math.cos(angle);
  const y = CY + labelR * Math.sin(angle);

  const eps = 0.01;
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  if (Math.cos(angle) > eps) textAnchor = 'start';
  if (Math.cos(angle) < -eps) textAnchor = 'end';

  let dy = '0.35em';
  if (Math.sin(angle) < -0.5) dy = '-0.5em';
  if (Math.sin(angle) > 0.5) dy = '1em';

  return { x, y, textAnchor, dy };
}

export default function ProposalHealthRadar({ scores }: Props) {
  const values = AXES.map((ax) => Math.min(100, Math.max(0, scores[ax] ?? 0)));
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / N);

  const dataPoints = AXES.map((_, i) => polarToXY(i, values[i]));
  const dataPolygon = toPoints(dataPoints);

  return (
    <div
      className="
        rounded-2xl border border-white/10
        bg-white/5 backdrop-blur-md
        p-4 flex flex-col items-center gap-3
        shadow-lg shadow-violet-950/40
      "
    >
      <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">
        Saúde da Proposta
      </h3>

      <svg
        viewBox="0 0 300 300"
        width={260}
        height={260}
        aria-label="Radar de saúde da proposta"
      >
        {/* ── Grid concêntrico ── */}
        {GRID_LEVELS.map((level) => {
          const gridPts = AXES.map((_, i) => polarToXY(i, level));
          return (
            <polygon
              key={level}
              points={toPoints(gridPts)}
              fill="none"
              stroke="#ffffff18"
              strokeWidth={1}
            />
          );
        })}

        {/* ── Eixos radiais ── */}
        {AXES.map((_, i) => {
          const [x, y] = polarToXY(i, 100);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="#ffffff12"
              strokeWidth={1}
            />
          );
        })}

        {/* ── Polígono de dados ── */}
        <polygon
          points={dataPolygon}
          fill="rgba(139,92,246,0.18)"
          stroke="rgb(139,92,246)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* ── Pontos nos vértices ── */}
        {dataPoints.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill="rgb(139,92,246)"
            stroke="rgb(196,181,253)"
            strokeWidth={1.5}
          />
        ))}

        {/* ── Labels nos vértices ── */}
        {AXES.map((ax, i) => {
          const { x, y, textAnchor, dy } = labelProps(i);
          return (
            <text
              key={ax}
              x={x}
              y={y}
              dy={dy}
              textAnchor={textAnchor}
              fontSize={10}
              fill="#a1a1aa"
              fontFamily="inherit"
            >
              {ax}
            </text>
          );
        })}

        {/* ── Score médio no centro ── */}
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fontSize={28}
          fontWeight="bold"
          fill="rgb(196,181,253)"
          fontFamily="inherit"
        >
          {avg}
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          fontSize={9}
          fill="#71717a"
          fontFamily="inherit"
        >
          MÉDIA GERAL
        </text>
      </svg>

      {/* ── Legenda compacta ── */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full px-2">
        {AXES.map((ax, i) => (
          <div key={ax} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-zinc-500 truncate">{ax}</span>
            <span
              className="font-semibold tabular-nums"
              style={{ color: scoreColor(values[i]) }}
            >
              {values[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function scoreColor(v: number): string {
  if (v >= 75) return 'rgb(74,222,128)';   // green-400
  if (v >= 50) return 'rgb(250,204,21)';   // yellow-400
  return 'rgb(248,113,113)';               // red-400
}
