import type { DailyStat } from "@/api/types";

interface CompletionChartProps {
  daily: DailyStat[];
}

const CHART_H = 100;
const BAR_W = 28;
const GAP = 8;
const PADDING = { top: 12, right: 8, bottom: 28, left: 32 };

export function CompletionChart({ daily }: CompletionChartProps) {
  if (daily.length === 0) return null;

  const chartW = daily.length * (BAR_W + GAP) - GAP;
  const svgW = chartW + PADDING.left + PADDING.right;
  const svgH = CHART_H + PADDING.top + PADDING.bottom;

  return (
    <div>
      <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Taxa de conclusão</p>
      <svg
        width="100%"
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        {/* Y grid lines at 0%, 50%, 100% */}
        {[0, 0.5, 1].map((ratio) => {
          const y = PADDING.top + CHART_H * (1 - ratio);
          return (
            <g key={ratio}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + chartW}
                y2={y}
                stroke="#27272a"
                strokeWidth={1}
                strokeDasharray={ratio === 0 ? "0" : "3 3"}
              />
              <text
                x={PADDING.left - 4}
                y={y + 3}
                fontSize={8}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fill="#52525b"
              >
                {Math.round(ratio * 100)}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {daily.map((d, i) => {
          const barH = Math.max(d.completion_rate * CHART_H, d.completion_rate > 0 ? 3 : 0);
          const x = PADDING.left + i * (BAR_W + GAP);
          const y = PADDING.top + CHART_H - barH;
          const label = new Date(d.date + "T12:00:00Z").toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            timeZone: "UTC",
          });

          return (
            <g key={d.date}>
              {/* Background bar */}
              <rect
                x={x}
                y={PADDING.top}
                width={BAR_W}
                height={CHART_H}
                rx={4}
                fill="#ffffff08"
              />
              {/* Value bar */}
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={4}
                fill="#7c3aed"
                opacity={0.7 + d.completion_rate * 0.3}
              />
              {/* Value label inside bar if tall enough */}
              {barH > 16 && (
                <text
                  x={x + BAR_W / 2}
                  y={y + 12}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="JetBrains Mono, monospace"
                  fill="#e9d5ff"
                >
                  {Math.round(d.completion_rate * 100)}%
                </text>
              )}
              {/* X label */}
              <text
                x={x + BAR_W / 2}
                y={PADDING.top + CHART_H + 16}
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
