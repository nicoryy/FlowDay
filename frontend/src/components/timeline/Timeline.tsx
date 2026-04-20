import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, CheckCircle2, Clock } from "lucide-react";
import { logsApi } from "@/api/logs";
import { toast } from "@/stores/toast";
import type { ScheduleResponse, ScheduledBlock } from "@/api/types";
import { ApiError } from "@/api/client";

const PRIORITY_COLOR: Record<number, string> = {
  1: "#ef4444",
  2: "#f59e0b",
  3: "#22c55e",
};

const PRIORITY_LABEL: Record<number, string> = {
  1: "Alta",
  2: "Média",
  3: "Baixa",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Planejado",
  in_progress: "Em andamento",
  done: "Concluído",
  pending: "Pendente",
};

const AXIS_H = 28;
const BLOCK_H = 52;
const SVG_H = AXIS_H + BLOCK_H + 12;
const MIN_WIDTH = 640;
const MIN_LABEL_W = 80;
// suppress hour ticks within this distance of work start/end to avoid label overlap
const TICK_EDGE_GUARD_MS = 25 * 60 * 1000;

// Backend stores datetimes in SQLite without timezone — always treat as UTC
function parseISO(iso: string): Date {
  if (iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso);
  return new Date(iso + "Z");
}

function parseWorkTime(date: string, time: string): Date {
  return new Date(`${date}T${time}Z`);
}

function fmtTime(iso: string): string {
  return parseISO(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function hourTicks(workStart: Date, workEnd: Date): Date[] {
  const ticks: Date[] = [];
  const cursor = new Date(workStart);
  cursor.setUTCMinutes(0, 0, 0);
  if (cursor < workStart) cursor.setUTCHours(cursor.getUTCHours() + 1);
  while (cursor <= workEnd) {
    ticks.push(new Date(cursor));
    cursor.setUTCHours(cursor.getUTCHours() + 1);
  }
  // Filter ticks too close to work start/end to avoid overlapping static labels
  return ticks.filter(
    (t) =>
      Math.abs(t.getTime() - workStart.getTime()) > TICK_EDGE_GUARD_MS &&
      Math.abs(t.getTime() - workEnd.getTime()) > TICK_EDGE_GUARD_MS
  );
}

interface HoverInfo {
  block: ScheduledBlock;
  x: number;
  w: number;
}

interface BlockProps {
  block: ScheduledBlock;
  x: number;
  w: number;
  sessionId: string;
  onMutated: () => void;
  onHoverChange: (info: HoverInfo | null) => void;
}

function TimelineBlock({ block, x, w, sessionId, onMutated, onHoverChange }: BlockProps) {
  const qc = useQueryClient();

  const startMutation = useMutation({
    mutationFn: () =>
      logsApi.start({ task_id: block.task_id, work_session_id: sessionId }),
    onSuccess: () => {
      toast.success(`"${block.task_title}" iniciado`);
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      onMutated();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Erro ao iniciar"),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const active = await logsApi.getActive(block.task_id);
      if (!active) throw new Error("Log ativo não encontrado");
      return logsApi.update(active.id, { completed: true });
    },
    onSuccess: () => {
      toast.success(`"${block.task_title}" concluído!`);
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      onMutated();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Erro ao concluir"),
  });

  const status = block.task_status;
  const color = PRIORITY_COLOR[block.priority] ?? "#6d28d9";
  const isDone = status === "done";
  const isActive = status === "in_progress";

  const bgColor = isDone ? "#16a34a22" : isActive ? "#7c3aed33" : "#ffffff0a";
  const borderColor = isDone ? "#16a34a66" : isActive ? "#7c3aed" : "#27272a";
  const textColor = isDone ? "#4ade8099" : isActive ? "#c4b5fd" : "#f4f4f5";

  const loading = startMutation.isPending || completeMutation.isPending;
  const isNarrow = w < MIN_LABEL_W;

  return (
    <g
      transform={`translate(${x}, ${AXIS_H + 4})`}
      style={{ cursor: isDone ? "default" : "pointer" }}
      onClick={() => {
        if (loading || isDone) return;
        if (isActive) completeMutation.mutate();
        else startMutation.mutate();
      }}
      onMouseEnter={() => onHoverChange({ block, x, w })}
      onMouseLeave={() => onHoverChange(null)}
    >
      {/* Block body */}
      <rect
        width={Math.max(w - 3, 2)}
        height={BLOCK_H}
        rx={6}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={1.5}
      />
      {/* Priority stripe */}
      <rect width={3} height={BLOCK_H} rx={2} fill={color} opacity={isDone ? 0.4 : 0.9} />

      {/* Label — only when wide enough */}
      {!isNarrow && (
        <>
          <text
            x={10}
            y={20}
            fontSize={11}
            fontFamily="Outfit, sans-serif"
            fontWeight={500}
            fill={textColor}
            clipPath={`url(#clip-${block.id})`}
          >
            {block.task_title}
          </text>
          <text
            x={10}
            y={34}
            fontSize={9}
            fontFamily="JetBrains Mono, monospace"
            fill={textColor}
            opacity={0.6}
          >
            {fmtTime(block.planned_start)}–{fmtTime(block.planned_end)}
          </text>
          <defs>
            <clipPath id={`clip-${block.id}`}>
              <rect width={w - 16} height={BLOCK_H} />
            </clipPath>
          </defs>
        </>
      )}

      {/* Action icon */}
      {!isDone && w >= 36 && (
        <g transform={`translate(${Math.max(w - 26, 8)}, 16)`} opacity={loading ? 0.5 : 1}>
          {isActive ? (
            <CheckCircle2 size={16} color="#a78bfa" />
          ) : (
            <Play size={14} color="#71717a" />
          )}
        </g>
      )}

      {isDone && w >= 20 && (
        <g transform={`translate(${Math.max(w - 26, 8)}, 16)`}>
          <CheckCircle2 size={16} color="#4ade80" opacity={0.6} />
        </g>
      )}
    </g>
  );
}

interface TimelineProps {
  schedule: ScheduleResponse;
}

export function Timeline({ schedule }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(MIN_WIDTH);
  const [, forceUpdate] = useState(0);
  const [hovered, setHovered] = useState<HoverInfo | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setSvgWidth(Math.max(el.clientWidth, MIN_WIDTH));
    });
    obs.observe(el);
    setSvgWidth(Math.max(el.clientWidth, MIN_WIDTH));
    return () => obs.disconnect();
  }, []);

  const workStart = parseWorkTime(schedule.date, schedule.work_start);
  const workEnd = parseWorkTime(schedule.date, schedule.work_end);
  const totalMs = workEnd.getTime() - workStart.getTime();

  const toX = (iso: string) =>
    ((parseISO(iso).getTime() - workStart.getTime()) / totalMs) * svgWidth;
  const toW = (mins: number) => (mins / (totalMs / 60000)) * svgWidth;

  const ticks = hourTicks(workStart, workEnd);

  const nowMs = Date.now();
  const nowInRange = nowMs >= workStart.getTime() && nowMs <= workEnd.getTime();
  const nowX = ((nowMs - workStart.getTime()) / totalMs) * svgWidth;

  // Tooltip positioning — centered on block, above the SVG blocks area
  const tooltipLeft = hovered ? hovered.x + hovered.w / 2 : 0;
  const tooltipBlock = hovered?.block;

  return (
    <div ref={containerRef} className="relative overflow-x-auto">
      <svg
        width={svgWidth}
        height={SVG_H}
        style={{ display: "block", minWidth: MIN_WIDTH }}
      >
        {/* Background */}
        <rect width={svgWidth} height={SVG_H} fill="transparent" />

        {/* Axis baseline */}
        <line x1={0} y1={AXIS_H} x2={svgWidth} y2={AXIS_H} stroke="#27272a" strokeWidth={1} />

        {/* Hour ticks — filtered to avoid overlap with work start/end labels */}
        {ticks.map((tick) => {
          const x = ((tick.getTime() - workStart.getTime()) / totalMs) * svgWidth;
          return (
            <g key={tick.toISOString()}>
              <line x1={x} y1={AXIS_H - 4} x2={x} y2={AXIS_H} stroke="#3f3f46" strokeWidth={1} />
              <text
                x={x}
                y={AXIS_H - 8}
                textAnchor="middle"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                fill="#52525b"
              >
                {tick.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}
              </text>
            </g>
          );
        })}

        {/* Work start/end labels — always visible, outside the filtered tick zone */}
        <text x={4} y={AXIS_H - 8} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="#71717a">
          {schedule.work_start.slice(0, 5)}
        </text>
        <text
          x={svgWidth - 4}
          y={AXIS_H - 8}
          textAnchor="end"
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill="#71717a"
        >
          {schedule.work_end.slice(0, 5)}
        </text>

        {/* Task blocks */}
        {schedule.blocks.map((block) => {
          const x = toX(block.planned_start);
          const w = toW(block.estimated_minutes);
          return (
            <TimelineBlock
              key={block.id}
              block={block}
              x={x}
              w={w}
              sessionId={schedule.session_id}
              onMutated={() => forceUpdate((n) => n + 1)}
              onHoverChange={setHovered}
            />
          );
        })}

        {/* Now indicator */}
        {nowInRange && (
          <g>
            <line
              x1={nowX}
              y1={0}
              x2={nowX}
              y2={SVG_H}
              stroke="#7c3aed"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <circle cx={nowX} cy={AXIS_H} r={3} fill="#7c3aed" />
          </g>
        )}
      </svg>

      {/* Hover tooltip for all blocks (essential for narrow ones) */}
      {tooltipBlock && (
        <div
          className="pointer-events-none absolute z-20 min-w-[160px] max-w-[220px] rounded-lg border border-border bg-background-secondary px-3 py-2.5 shadow-xl transition-opacity duration-100"
          style={{
            left: Math.min(Math.max(tooltipLeft, 80), svgWidth - 80),
            bottom: "100%",
            transform: "translateX(-50%)",
            marginBottom: 4,
          }}
        >
          <p className="text-xs font-medium text-text-primary leading-snug mb-1">
            {tooltipBlock.task_title}
          </p>
          <p className="text-[10px] font-mono text-text-muted">
            {fmtTime(tooltipBlock.planned_start)}–{fmtTime(tooltipBlock.planned_end)}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: PRIORITY_COLOR[tooltipBlock.priority] ?? "#6d28d9" }}
            />
            <span className="text-[10px] text-text-muted">
              {PRIORITY_LABEL[tooltipBlock.priority] ?? "—"} · {tooltipBlock.estimated_minutes}min
            </span>
          </div>
          {tooltipBlock.task_status !== "scheduled" && (
            <p className="text-[10px] text-purple-accent mt-0.5">
              {STATUS_LABEL[tooltipBlock.task_status] ?? tooltipBlock.task_status}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function TimelineLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-text-muted">
      <div className="flex items-center gap-1.5">
        <Play size={10} />
        <span>Clique para iniciar</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={10} />
        <span>Clique para concluir</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-px w-4 border-t border-dashed border-purple-primary" />
        <span>Agora</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock size={10} />
        <span>
          Prioridade:{" "}
          <span className="text-red-400">Alta</span> ·{" "}
          <span className="text-yellow-400">Média</span> ·{" "}
          <span className="text-green-400">Baixa</span>
        </span>
      </div>
    </div>
  );
}
