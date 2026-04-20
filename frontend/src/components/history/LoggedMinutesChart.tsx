import type { DailyStat } from "@/api/types";

interface LoggedMinutesChartProps {
  daily: DailyStat[];
}

const CHART_H = 100;
const PT = { top: 12, right: 8, bottom: 28, left: 36 };

export function LoggedMinutesChart({ daily }: LoggedMinutesChartProps) {
  if (daily.length === 0) return null;

  const maxMins = Math.max(...daily.map((d) => d.logged_minutes), 60);
  const totalW = 400;
  const usableW = totalW - PT.left - PT.right;
  const svgH = CHART_H + PT.top + PT.bottom;

  const stepX = daily.length > 1 ? usableW / (daily.length - 1) : usableW / 2;

  const points = daily.map((d, i) => ({
    x: PT.left + (daily.length > 1 ? i * stepX : usableW / 2),
    y: PT.top + CHART_H * (1 - d.logged_minutes / maxMins),
    d,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = [
    `${points[0].x},${PT.top + CHART_H}`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${PT.top + CHART_H}`,
  ].join(" ");

  return (
    <div>
      <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Minutos registrados/dia</p>
      <svg
        width="100%"
        viewBox={`0 0 ${totalW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        {/* Y grid */}
        {[0, 0.5, 1].map((ratio) => {
          const y = PT.top + CHART_H * (1 - ratio);
          const val = Math.round(maxMins * ratio);
          return (
            <g key={ratio}>
              <line
                x1={PT.left}
                y1={y}
                x2={totalW - PT.right}
                y2={y}
                stroke="#27272a"
                strokeWidth={1}
                strokeDasharray={ratio === 0 ? "0" : "3 3"}
              />
              <text
                x={PT.left - 4}
                y={y + 3}
                fontSize={8}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fill="#52525b"
              >
                {val >= 60 ? `${Math.floor(val / 60)}h` : `${val}m`}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={area} fill="#7c3aed" opacity={0.12} />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#7c3aed" strokeWidth={2} />

        {/* Dots + X labels */}
        {points.map((p) => {
          const label = new Date(p.d.date + "T12:00:00Z").toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            timeZone: "UTC",
          });
          return (
            <g key={p.d.date}>
              <circle cx={p.x} cy={p.y} r={3} fill="#7c3aed" />
              <circle cx={p.x} cy={p.y} r={5} fill="#7c3aed" opacity={0.2} />
              <text
                x={p.x}
                y={PT.top + CHART_H + 16}
                textAnchor="middle"
                fontSize={8}
                fontFamily="JetBrains Mono, monospace"
                fill="#52525b"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
