import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { tasksApi } from "@/api/tasks";
import type { Task, TaskCreate, TaskUpdate } from "@/api/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { ApiError } from "@/api/client";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  scheduled: "Agendado",
  in_progress: "Em andamento",
  done: "Concluído",
  skipped: "Pulado",
  overflow: "Overflow",
};

export function Tasks() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", filterStatus],
    queryFn: () => tasksApi.list(filterStatus ? { status: filterStatus } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: (payload: TaskCreate) => tasksApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setModalOpen(false);
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Erro ao criar tarefa"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaskUpdate }) =>
      tasksApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setEditing(null);
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Erro ao atualizar tarefa"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const handleSubmit = (values: TaskCreate) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setError(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Tarefas</h2>
          <p className="text-text-secondary mt-1 text-sm">
            {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-purple-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-hover"
        >
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "pending", "scheduled", "in_progress", "done", "overflow"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilterStatus(s)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-purple-muted text-purple-accent"
                : "bg-background-tertiary text-text-muted hover:text-text-secondary"
            }`}
          >
            {s ? STATUS_LABELS[s] : "Todas"}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-background-secondary animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background-secondary py-16 text-center">
          <p className="text-text-muted text-sm">Nenhuma tarefa encontrada.</p>
          <button
            onClick={openCreate}
            className="mt-3 text-purple-accent text-sm hover:underline"
          >
            Criar primeira tarefa
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <TaskFormModal
        open={modalOpen}
        task={editing}
        error={error}
        loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setError(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
