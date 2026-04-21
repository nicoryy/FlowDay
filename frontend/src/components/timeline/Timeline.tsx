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
  isHovered: boolean;
}

function TimelineBlock({ block, x, w, sessionId, onMutated, onHoverChange, isHovered }: BlockProps) {
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
      style={{
        cursor: isDone ? "default" : "pointer",
        opacity: isHovered ? 0 : 1,
        // When hovered, disable pointer events so the SVG block never fires
        // onMouseLeave while the HTML overlay is mounted on top — prevents flicker
        pointerEvents: isHovered ? "none" : "auto",
      }}
      onClick={() => {
        if (loading || isDone) return;
        if (isActive) completeMutation.mutate();
        else startMutation.mutate();
      }}
      onMouseEnter={() => onHoverChange({ block, x, w })}
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

interface HoverOverlayProps {
  block: ScheduledBlock;
  x: number;
  w: number;
  svgWidth: number;
  onClose: () => void;
  onAction: () => void;
  sessionId: string;
}

function HoverOverlay({ block, x, w, svgWidth, onClose, onAction, sessionId }: HoverOverlayProps) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const startMutation = useMutation({
    mutationFn: () =>
      logsApi.start({ task_id: block.task_id, work_session_id: sessionId }),
    onSuccess: () => {
      toast.success(`"${block.task_title}" iniciado`);
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      onAction();
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
      onAction();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Erro ao concluir"),
  });

  useEffect(() => {
    // trigger expand animation on next frame
    const id = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const status = block.task_status;
  const color = PRIORITY_COLOR[block.priority] ?? "#6d28d9";
  const isDone = status === "done";
  const isActive = status === "in_progress";
  const loading = startMutation.isPending || completeMutation.isPending;

  const bgColor = isDone ? "#16a34a22" : isActive ? "#7c3aed33" : "#ffffff0a";
  const borderColor = isDone ? "#16a34a66" : isActive ? "#7c3aed" : "#27272a";
  const textColor = isDone ? "#4ade80" : isActive ? "#c4b5fd" : "#f4f4f5";

  // Expanded width: grow to show content but never exceed SVG right edge
  const expandedW = Math.min(Math.max(w + 140, 200), svgWidth - x);
  const currentW = expanded ? expandedW : w;
  const currentH = expanded ? BLOCK_H + 20 : BLOCK_H;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: AXIS_H + 4,
        width: currentW,
        height: currentH,
        overflow: "hidden",
        transition: "width 200ms ease-in-out, height 200ms ease-in-out",
        cursor: isDone ? "default" : "pointer",
        borderRadius: 6,
        border: `1.5px solid ${borderColor}`,
        background: bgColor,
        zIndex: 10,
        backdropFilter: "blur(4px)",
      }}
      onMouseLeave={onClose}
      onClick={() => {
        if (loading || isDone) return;
        if (isActive) completeMutation.mutate();
        else startMutation.mutate();
      }}
    >
      {/* Priority stripe */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 3,
          height: "100%",
          background: color,
          opacity: isDone ? 0.4 : 0.9,
          borderRadius: "2px 0 0 2px",
        }}
      />

      {/* Content */}
      <div style={{ paddingLeft: 10, paddingRight: 8, paddingTop: 8, paddingBottom: 6 }}>
        <p
          style={{
            fontSize: 11,
            fontFamily: "Outfit, sans-serif",
            fontWeight: 500,
            color: textColor,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {block.task_title}
        </p>
        <p
          style={{
            fontSize: 9,
            fontFamily: "JetBrains Mono, monospace",
            color: textColor,
            opacity: 0.6,
            margin: "4px 0 0",
            whiteSpace: "nowrap",
          }}
        >
          {fmtTime(block.planned_start)}–{fmtTime(block.planned_end)}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span
            style={{
              fontSize: 8,
              color: color,
              fontFamily: "Outfit, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            ● {PRIORITY_LABEL[block.priority] ?? "—"}
          </span>
          <span
            style={{
              fontSize: 8,
              color: textColor,
              opacity: 0.5,
              fontFamily: "JetBrains Mono, monospace",
              whiteSpace: "nowrap",
            }}
          >
            {block.estimated_minutes}min
          </span>
          {block.task_status !== "scheduled" && (
            <span
              style={{
                fontSize: 8,
                color: "#a78bfa",
                fontFamily: "Outfit, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {STATUS_LABEL[block.task_status] ?? block.task_status}
            </span>
          )}
        </div>
      </div>

      {/* Action icon — positioned at right of the block */}
      {!isDone && (
        <div
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: loading ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          {isActive ? (
            <CheckCircle2 size={16} color="#a78bfa" />
          ) : (
            <Play size={14} color="#71717a" />
          )}
        </div>
      )}

      {isDone && (
        <div
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <CheckCircle2 size={16} color="#4ade80" opacity={0.6} />
        </div>
      )}
    </div>
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

  // workStart/workEnd = local time expressed as fake-UTC (parseWorkTime adds Z).
  // Date.now() = true UTC. To align: local 11:22 (UTC-3) = UTC 14:22.
  // We need "11:22" in fake-UTC space = Date.now() - offsetMs.
  // getTimezoneOffset() for UTC-3 returns +180 → offsetMs = +10_800_000.
  // Date.now() - 10_800_000 = UTC11:22 ✓ (NOT +, sign was wrong before)
  const offsetMs = new Date().getTimezoneOffset() * 60 * 1000;
  const nowMsAdjusted = Date.now() - offsetMs;
  const nowInRange =
    nowMsAdjusted >= workStart.getTime() && nowMsAdjusted <= workEnd.getTime();
  const nowX = ((nowMsAdjusted - workStart.getTime()) / totalMs) * svgWidth;

  return (
    <div ref={containerRef} className="overflow-x-auto" style={{ position: "relative" }}>
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
              isHovered={hovered?.block.id === block.id}
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

      {/* HTML overlay for hovered block — enables smooth CSS width/height animation */}
      {hovered && (
        <HoverOverlay
          block={hovered.block}
          x={hovered.x}
          w={hovered.w}
          svgWidth={svgWidth}
          onClose={() => setHovered(null)}
          onAction={() => {
            setHovered(null);
            forceUpdate((n) => n + 1);
          }}
          sessionId={schedule.session_id}
        />
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
