import { useMemo } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/api/tasks";
import { logsApi } from "@/api/logs";
import { toast } from "@/stores/toast";
import { ApiError } from "@/api/client";
import type { Task } from "@/api/types";
import { KanbanColumn, type ColumnId } from "./KanbanColumn";

const COLUMNS: Array<{
  id: ColumnId;
  title: string;
  statuses: string[];
  color: string;
  emptyLabel: string;
}> = [
  {
    id: "todo",
    title: "A Fazer",
    statuses: ["pending", "scheduled"],
    color: "#71717a",
    emptyLabel: "Nenhuma tarefa pendente",
  },
  {
    id: "in_progress",
    title: "Em Andamento",
    statuses: ["in_progress"],
    color: "#7c3aed",
    emptyLabel: "Nenhuma em andamento",
  },
  {
    id: "done",
    title: "Concluído",
    statuses: ["done"],
    color: "#22c55e",
    emptyLabel: "Nenhuma concluída ainda",
  },
  {
    id: "overflow",
    title: "Overflow",
    statuses: ["overflow"],
    color: "#f59e0b",
    emptyLabel: "Sem overflow",
  },
];

function columnOf(task: Task): ColumnId {
  if (task.status === "in_progress") return "in_progress";
  if (task.status === "done") return "done";
  if (task.status === "overflow") return "overflow";
  return "todo";
}

interface KanbanBoardProps {
  sessionId: string | null;
}

export function KanbanBoard({ sessionId }: KanbanBoardProps) {
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list(),
  });

  const grouped = useMemo(() => {
    const map: Record<ColumnId, Task[]> = { todo: [], in_progress: [], done: [], overflow: [] };
    for (const task of tasks) map[columnOf(task)].push(task);
    return map;
  }, [tasks]);

  const startMutation = useMutation({
    mutationFn: (task: Task) =>
      logsApi.start({ task_id: task.id, work_session_id: sessionId ?? undefined }),
    onSuccess: (_, task) => {
      toast.success(`"${task.title}" iniciado`);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Erro ao iniciar"),
  });

  const completeMutation = useMutation({
    mutationFn: async (task: Task) => {
      const active = await logsApi.getActive(task.id);
      if (!active) throw new Error("Log ativo não encontrado");
      return logsApi.update(active.id, { completed: true });
    },
    onSuccess: (_, task) => {
      toast.success(`"${task.title}" concluído!`);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Erro ao concluir"),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetColumn = over.id as ColumnId;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentColumn = columnOf(task);
    if (currentColumn === targetColumn) return;

    // todo -> in_progress: start
    if (targetColumn === "in_progress" && currentColumn === "todo") {
      startMutation.mutate(task);
      return;
    }

    // in_progress -> done: complete
    if (targetColumn === "done" && currentColumn === "in_progress") {
      completeMutation.mutate(task);
      return;
    }

    // other transitions: not supported without extra endpoints
    toast.info("Arraste de 'A Fazer' para 'Em Andamento', ou de 'Em Andamento' para 'Concluído'.");
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-lg bg-background-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={grouped[col.id]}
            accentColor={col.color}
            emptyLabel={col.emptyLabel}
          />
        ))}
      </div>
    </DndContext>
  );
}
