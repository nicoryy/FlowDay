import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2 } from "lucide-react";
import { statsApi } from "@/api/stats";
import type { StatsPeriod } from "@/api/types";
import { StatsCard } from "@/components/history/StatsCard";
import { CompletionChart } from "@/components/history/CompletionChart";
import { LoggedMinutesChart } from "@/components/history/LoggedMinutesChart";
import { PriorityBreakdown } from "@/components/history/PriorityBreakdown";

const TODAY = new Date().toISOString().split("T")[0];

function fmtMinutes(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function fmtDeviation(mins: number): string {
  if (mins === 0) return "0min";
  const sign = mins > 0 ? "+" : "";
  return `${sign}${Math.round(mins)}min`;
}

export function History() {
  const [period, setPeriod] = useState<StatsPeriod>("week");

  const { data, isLoading } = useQuery({
    queryKey: ["stats", period, TODAY],
    queryFn: () => statsApi.get({ period, date: TODAY }),
  });

  const hasData = (data?.summary.total_scheduled ?? 0) > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">Histórico</h2>
          <p className="text-text-secondary mt-1 text-sm">Métricas de produtividade</p>
        </div>
        {/* Period toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm self-start sm:self-auto">
          {(["day", "week"] as StatsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 transition-colors ${
                period === p
                  ? "bg-purple-primary text-white"
                  : "bg-background-secondary text-text-muted hover:text-text-secondary"
              }`}
            >
              {p === "day" ? "Hoje" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-background-secondary animate-pulse" />
            ))}
          </div>
          <div className="h-40 rounded-lg bg-background-secondary animate-pulse" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background-secondary py-20 gap-3 text-center">
          <BarChart2 size={40} className="text-text-muted" />
          <div>
            <p className="text-text-primary font-medium">Nenhum dado ainda</p>
            <p className="text-text-muted text-sm mt-1">
              Planeje e execute tarefas para ver suas métricas aqui.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && hasData && data && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatsCard
              label="Concluídas"
              value={`${data.summary.total_done}/${data.summary.total_scheduled}`}
              sub={`${Math.round(data.summary.completion_rate * 100)}% de conclusão`}
              highlight
            />
            <StatsCard
              label="Abandonadas"
              value={String(data.summary.total_abandoned)}
              sub="revertidas para A Fazer"
              negative={data.summary.total_abandoned > 0}
            />
            <StatsCard
              label="Tempo registrado"
              value={fmtMinutes(data.summary.total_logged_minutes)}
              sub={period === "week" ? "nos últimos 7 dias" : "hoje"}
            />
            <StatsCard
              label="Desvio médio"
              value={fmtDeviation(data.summary.avg_deviation_minutes)}
              sub={
                data.summary.avg_deviation_minutes > 0
                  ? "acima da estimativa"
                  : data.summary.avg_deviation_minutes < 0
                  ? "abaixo da estimativa"
                  : "na estimativa"
              }
            />
          </div>

          {/* Charts */}
          {period === "week" && data.daily.length > 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background-secondary p-4">
                <CompletionChart daily={data.daily} />
              </div>
              <div className="rounded-lg border border-border bg-background-secondary p-4">
                <LoggedMinutesChart daily={data.daily} />
              </div>
            </div>
          )}

          {/* Priority breakdown */}
          <div className="rounded-lg border border-border bg-background-secondary p-4">
            <PriorityBreakdown data={data.by_priority} />
          </div>
        </div>
      )}
    </div>
  );
}
