import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, RefreshCw, Trash2, LayoutList, Kanban } from "lucide-react";
import { scheduleApi } from "@/api/schedule";
import { ApiError } from "@/api/client";
import { toast } from "@/stores/toast";
import { Timeline, TimelineLegend } from "@/components/timeline/Timeline";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { ScheduleResponse } from "@/api/types";

const TODAY = new Date().toISOString().split("T")[0];

export function Dashboard() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<"timeline" | "kanban">("timeline");

  const { data: schedule, isLoading } = useQuery<ScheduleResponse | null>({
    queryKey: ["schedule", TODAY],
    queryFn: async () => {
      try {
        return await scheduleApi.get(TODAY);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    refetchInterval: 30_000,
  });

  const generateMutation = useMutation({
    mutationFn: () => scheduleApi.generate({ date: TODAY }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Dia planejado com sucesso!");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Erro ao gerar plano"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => scheduleApi.delete(TODAY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.info("Plano removido. Tarefas voltaram para pendente.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Erro ao limpar plano"),
  });

  const completedCount = schedule?.blocks.filter((b) => b.task_status === "done").length ?? 0;
  const totalBlocks = schedule?.blocks.length ?? 0;

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
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode((v) => (v === "timeline" ? "kanban" : "timeline"))}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            {viewMode === "timeline" ? <Kanban size={14} /> : <LayoutList size={14} />}
            {viewMode === "timeline" ? "Kanban" : "Timeline"}
          </button>

          {schedule && (
            <button
              onClick={() => {
                if (confirm("Limpar o plano de hoje? As tarefas voltarão para pendente."))
                  deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:border-error/40 hover:text-error transition-colors"
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

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-6 w-40 rounded bg-background-secondary animate-pulse" />
          <div className="h-24 rounded-lg bg-background-secondary animate-pulse" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && !schedule && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background-secondary py-20 text-center gap-3">
          <CalendarDays size={40} className="text-text-muted" />
          <div>
            <p className="text-text-primary font-medium">Nenhum plano para hoje</p>
            <p className="text-text-muted text-sm mt-1">
              Crie suas tarefas e clique em "Planejar dia"
            </p>
          </div>
        </div>
      )}

      {/* Schedule */}
      {schedule && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-muted font-mono text-xs">
              {schedule.work_start.slice(0, 5)} → {schedule.work_end.slice(0, 5)}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-text-secondary">
              <span className="font-mono text-purple-accent">{completedCount}</span>
              <span className="text-text-muted">/{totalBlocks} concluídas</span>
            </span>
            {schedule.overflow.length > 0 && (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-orange-400 text-xs">
                  {schedule.overflow.length} em overflow
                </span>
              </>
            )}
          </div>

          {/* Progress bar */}
          {totalBlocks > 0 && (
            <div className="h-1 w-full rounded-full bg-background-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-primary transition-all duration-500"
                style={{ width: `${(completedCount / totalBlocks) * 100}%` }}
              />
            </div>
          )}

          {/* Timeline / Kanban */}
          {viewMode === "timeline" ? (
            <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-3">
              {schedule.blocks.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-6">
                  Nenhuma tarefa pendente foi alocada.
                </p>
              ) : (
                <>
                  <Timeline schedule={schedule} />
                  <TimelineLegend />
                </>
              )}
            </div>
          ) : (
            <KanbanBoard sessionId={schedule.session_id} />
          )}

          {/* Overflow */}
          {schedule.overflow.length > 0 && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
              <p className="text-xs font-medium text-orange-400 uppercase tracking-wide">
                Overflow — não couberam hoje
              </p>
              <div className="space-y-1">
                {schedule.overflow.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-orange-400/60">·</span>
                    <span>{t.title}</span>
                    <span className="font-mono text-xs text-text-muted">{t.estimated_minutes}m</span>
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
