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

const AXIS_H = 28;
const BLOCK_H = 52;
const SVG_H = AXIS_H + BLOCK_H + 12;
const MIN_WIDTH = 640;

function parseWorkTime(date: string, time: string): Date {
  return new Date(`${date}T${time}Z`);
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
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
  return ticks;
}

interface BlockProps {
  block: ScheduledBlock;
  x: number;
  w: number;
  sessionId: string;
  onMutated: () => void;
}

function TimelineBlock({ block, x, w, sessionId, onMutated }: BlockProps) {
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

  const bgColor = isDone
    ? "#16a34a22"
    : isActive
      ? "#7c3aed33"
      : "#ffffff0a";
  const borderColor = isDone ? "#16a34a66" : isActive ? "#7c3aed" : "#27272a";
  const textColor = isDone ? "#4ade8099" : isActive ? "#c4b5fd" : "#f4f4f5";

  const MIN_LABEL_W = 80;
  const loading = startMutation.isPending || completeMutation.isPending;

  return (
    <g
      transform={`translate(${x}, ${AXIS_H + 4})`}
      style={{ cursor: isDone ? "default" : "pointer" }}
      onClick={() => {
        if (loading || isDone) return;
        if (isActive) completeMutation.mutate();
        else startMutation.mutate();
      }}
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

      {/* Label */}
      {w >= MIN_LABEL_W && (
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
    ((new Date(iso).getTime() - workStart.getTime()) / totalMs) * svgWidth;
  const toW = (mins: number) => (mins / (totalMs / 60000)) * svgWidth;

  const ticks = hourTicks(workStart, workEnd);

  const nowMs = Date.now();
  const nowInRange = nowMs >= workStart.getTime() && nowMs <= workEnd.getTime();
  const nowX = ((nowMs - workStart.getTime()) / totalMs) * svgWidth;

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={SVG_H}
        style={{ display: "block", minWidth: MIN_WIDTH }}
      >
        {/* Background */}
        <rect width={svgWidth} height={SVG_H} fill="transparent" />

        {/* Axis baseline */}
        <line x1={0} y1={AXIS_H} x2={svgWidth} y2={AXIS_H} stroke="#27272a" strokeWidth={1} />

        {/* Hour ticks */}
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

        {/* Work start/end labels */}
        <text x={4} y={AXIS_H - 8} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="#3f3f46">
          {schedule.work_start.slice(0, 5)}
        </text>
        <text
          x={svgWidth - 4}
          y={AXIS_H - 8}
          textAnchor="end"
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill="#3f3f46"
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
        <span>Prioridade: <span className="text-red-400">Alta</span> · <span className="text-yellow-400">Média</span> · <span className="text-green-400">Baixa</span></span>
      </div>
    </div>
  );
}
