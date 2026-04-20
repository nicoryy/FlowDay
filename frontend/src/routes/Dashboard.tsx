import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, RefreshCw, Trash2, Clock } from "lucide-react";
import { scheduleApi } from "@/api/schedule";
import { ApiError } from "@/api/client";
import type { ScheduleResponse } from "@/api/types";

const TODAY = new Date().toISOString().split("T")[0];

const PRIORITY_COLOR = {
  1: "bg-red-500",
  2: "bg-yellow-500",
  3: "bg-green-500",
} as const;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function Dashboard() {
  const qc = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: schedule, isLoading: loadingSchedule } = useQuery<ScheduleResponse | null>({
    queryKey: ["schedule", TODAY],
    queryFn: async () => {
      try {
        return await scheduleApi.get(TODAY);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => scheduleApi.generate({ date: TODAY }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule", TODAY] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setApiError(null);
    },
    onError: (e) => setApiError(e instanceof ApiError ? e.message : "Erro ao gerar plano"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => scheduleApi.delete(TODAY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule", TODAY] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setApiError(null);
    },
    onError: (e) => setApiError(e instanceof ApiError ? e.message : "Erro ao limpar plano"),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Dashboard</h2>
          <p className="text-text-secondary mt-1 text-sm font-mono">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {schedule && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:border-error/50 hover:text-error transition-colors"
              title="Limpar plano de hoje"
            >
              <Trash2 size={14} />
              Limpar
            </button>
          )}
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !!schedule}
            className="flex items-center gap-2 rounded-lg bg-purple-primary px-4 py-2 text-sm font-medium text-white hover:bg-purple-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <CalendarDays size={14} />
            )}
            {schedule ? "Dia planejado" : "Planejar dia"}
          </button>
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
          {apiError}
        </div>
      )}

      {/* Loading */}
      {loadingSchedule && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-background-secondary animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loadingSchedule && !schedule && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background-secondary py-20 text-center">
          <CalendarDays size={40} className="text-text-muted mb-4" />
          <p className="text-text-primary font-medium">Nenhum plano para hoje</p>
          <p className="text-text-muted text-sm mt-1">
            Crie suas tarefas e clique em "Planejar dia"
          </p>
        </div>
      )}

      {/* Timeline */}
      {schedule && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
            <Clock size={12} />
            <span>{schedule.work_start} → {schedule.work_end}</span>
            <span>·</span>
            <span>{schedule.blocks.length} bloco{schedule.blocks.length !== 1 ? "s" : ""}</span>
            {schedule.overflow.length > 0 && (
              <>
                <span>·</span>
                <span className="text-orange-400">{schedule.overflow.length} overflow</span>
              </>
            )}
          </div>

          {/* Blocks */}
          <div className="space-y-2">
            {schedule.blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-background-secondary px-4 py-3"
              >
                <div
                  className={`h-10 w-1 rounded-full flex-shrink-0 ${
                    PRIORITY_COLOR[block.priority as 1 | 2 | 3] ?? "bg-zinc-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{block.task_title}</p>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    {formatTime(block.planned_start)} → {formatTime(block.planned_end)}
                  </p>
                </div>
                <div className="text-xs text-text-muted font-mono flex-shrink-0">
                  {block.estimated_minutes}m
                </div>
              </div>
            ))}
          </div>

          {/* Overflow */}
          {schedule.overflow.length > 0 && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-xs font-medium text-orange-400 mb-2 uppercase tracking-wide">
                Tarefas em overflow — não couberam hoje
              </p>
              <div className="space-y-1">
                {schedule.overflow.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-orange-400">·</span>
                    <span>{task.title}</span>
                    <span className="font-mono text-xs text-text-muted">{task.estimated_minutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
