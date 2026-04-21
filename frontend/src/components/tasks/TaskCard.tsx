import { Clock, Pencil, Trash2 } from "lucide-react";
import type { Task } from "@/api/types";

const PRIORITY_CONFIG = {
  1: { label: "Alta", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  2: { label: "Média", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  3: { label: "Baixa", className: "bg-green-500/10 text-green-400 border-green-500/20" },
} as const;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-zinc-500/10 text-zinc-400" },
  scheduled: { label: "Agendado", className: "bg-purple-500/10 text-purple-400" },
  in_progress: { label: "Em andamento", className: "bg-blue-500/10 text-blue-400" },
  done: { label: "Concluído", className: "bg-green-500/10 text-green-400" },
  skipped: { label: "Pulado", className: "bg-zinc-500/10 text-zinc-500" },
  overflow: { label: "Overflow", className: "bg-orange-500/10 text-orange-400" },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status] ?? { label: task.status, className: "" };

  const handleDelete = () => {
    if (confirm(`Deletar "${task.title}"?`)) onDelete(task.id);
  };

  return (
    <div className="group flex items-center gap-3 sm:gap-4 rounded-lg border border-border bg-background-secondary px-3 sm:px-4 py-3 transition-colors hover:border-border/80 hover:bg-background-tertiary">
      {/* Priority indicator */}
      <div
        className={`h-8 w-1 rounded-full flex-shrink-0 ${
          task.priority === 1 ? "bg-red-500" : task.priority === 2 ? "bg-yellow-500" : "bg-green-500"
        }`}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-text-primary truncate">{task.title}</span>
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-medium flex-shrink-0 ${priority.className}`}
          >
            {priority.label}
          </span>
          <span className={`rounded-md px-2 py-0.5 text-xs flex-shrink-0 ${status.className}`}>
            {status.label}
          </span>
        </div>
        {task.description && (
          <p className="mt-0.5 text-xs text-text-muted truncate">{task.description}</p>
        )}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0 font-mono">
        <Clock size={12} />
        {task.estimated_minutes}m
      </div>

      {/* Actions — sempre visíveis em mobile; aparecem no hover em desktop */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="rounded-md p-1.5 text-text-muted hover:bg-background hover:text-text-primary transition-colors"
          title="Editar"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          className="rounded-md p-1.5 text-text-muted hover:bg-background hover:text-error transition-colors"
          title="Deletar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
