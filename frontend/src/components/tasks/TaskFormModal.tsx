import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Task, TaskCreate } from "@/api/types";

interface TaskFormModalProps {
  open: boolean;
  task: Task | null;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: TaskCreate) => void;
}

const PRIORITY_OPTIONS = [
  { value: 1, label: "Alta", desc: "Fazer primeiro" },
  { value: 2, label: "Média", desc: "Normal" },
  { value: 3, label: "Baixa", desc: "Quando sobrar tempo" },
] as const;

export function TaskFormModal({ open, task, error, loading, onClose, onSubmit }: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [priority, setPriority] = useState<1 | 2 | 3>(2);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setMinutes(String(task.estimated_minutes));
      setPriority(task.priority);
    } else {
      setTitle("");
      setDescription("");
      setMinutes("30");
      setPriority(2);
    }
  }, [task, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(minutes, 10);
    if (!title.trim() || isNaN(mins) || mins < 1) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      estimated_minutes: mins,
      priority,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-border bg-background-secondary shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-text-primary">
            {task ? "Editar tarefa" : "Nova tarefa"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Revisar pull request"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes opcionais..."
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Duração estimada (minutos) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                min={1}
                max={480}
                required
                className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-text-primary focus:border-purple-primary focus:outline-none focus:ring-1 focus:ring-purple-primary"
              />
              <div className="flex gap-1">
                {[15, 30, 45, 60, 90].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(String(m))}
                    className={`rounded-md px-2 py-1 text-xs font-mono transition-colors ${
                      minutes === String(m)
                        ? "bg-purple-muted text-purple-accent"
                        : "bg-background text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Prioridade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    priority === opt.value
                      ? "border-purple-primary bg-purple-muted"
                      : "border-border bg-background hover:border-border/60"
                  }`}
                >
                  <div className="text-sm font-medium text-text-primary">{opt.label}</div>
                  <div className="text-xs text-text-muted">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2 text-sm text-text-secondary hover:bg-background-tertiary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 rounded-lg bg-purple-primary py-2 text-sm font-medium text-white hover:bg-purple-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : task ? "Salvar" : "Criar tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
