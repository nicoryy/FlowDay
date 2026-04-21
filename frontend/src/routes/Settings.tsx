import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Clock } from "lucide-react";
import { configApi } from "@/api/config";
import { toast } from "@/stores/toast";
import { ApiError } from "@/api/client";
import type { UserConfigUpdate } from "@/api/types";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function Settings() {
  const qc = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: configApi.get,
  });

  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [breakDuration, setBreakDuration] = useState("5");
  const [breakInterval, setBreakInterval] = useState("50");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!config) return;
    setWorkStart(config.default_work_start.slice(0, 5));
    setWorkEnd(config.default_work_end.slice(0, 5));
    setBreakDuration(String(config.break_duration_min));
    setBreakInterval(String(config.break_interval_min));
    setNotifications(config.notifications_enabled);
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (payload: UserConfigUpdate) => configApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config"] });
      toast.success("Configurações salvas!");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Erro ao salvar"),
  });

  const usefulMinutes = Math.max(0, (() => {
    const total = timeToMinutes(workEnd) - timeToMinutes(workStart);
    if (total <= 0) return 0;
    const interval = parseInt(breakInterval) || 50;
    const duration = parseInt(breakDuration) || 5;
    const breaks = Math.floor(total / interval);
    return Math.max(0, total - breaks * duration);
  })());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      default_work_start: `${workStart}:00`,
      default_work_end: `${workEnd}:00`,
      break_duration_min: parseInt(breakDuration),
      break_interval_min: parseInt(breakInterval),
      notifications_enabled: notifications,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded bg-background-secondary animate-pulse" />
        <div className="h-64 rounded-lg bg-background-secondary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full sm:max-w-lg">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">Configurações</h2>
        <p className="text-text-secondary mt-1 text-sm">Janela de trabalho e pausas</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Work window */}
        <section className="rounded-lg border border-border bg-background-secondary p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
            <Clock size={14} className="text-purple-accent" />
            Janela de trabalho
          </h3>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide">Início</label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-text-primary focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide">Fim</label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-text-primary focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary"
              />
            </div>
          </div>

          {/* Useful time preview */}
          <div className="rounded-md bg-background px-3 py-2 text-xs text-text-muted font-mono">
            ≈{" "}
            <span className="text-purple-accent font-medium">
              {Math.floor(usefulMinutes / 60)}h{usefulMinutes % 60 > 0 ? `${usefulMinutes % 60}m` : ""}
            </span>{" "}
            de tempo útil por dia
          </div>
        </section>

        {/* Breaks */}
        <section className="rounded-lg border border-border bg-background-secondary p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">Pausas automáticas</h3>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide">
                Duração (min)
              </label>
              <input
                type="number"
                value={breakDuration}
                onChange={(e) => setBreakDuration(e.target.value)}
                min={0}
                max={60}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-text-primary focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide">
                Intervalo (min)
              </label>
              <input
                type="number"
                value={breakInterval}
                onChange={(e) => setBreakInterval(e.target.value)}
                min={10}
                max={120}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-text-primary focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary"
              />
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Pausa de {breakDuration}min a cada {breakInterval}min trabalhados
          </p>
        </section>

        {/* Notifications */}
        <section className="rounded-lg border border-border bg-background-secondary p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Notificações</p>
              <p className="text-xs text-text-muted mt-0.5">Alertas de transição de tarefa</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifications((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                notifications ? "bg-purple-primary" : "bg-background-tertiary"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  notifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-purple-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-hover transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {updateMutation.isPending ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
