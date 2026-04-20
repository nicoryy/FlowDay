import { useDroppable } from "@dnd-kit/core";
import type { Task } from "@/api/types";
import { KanbanCard } from "./KanbanCard";

export type ColumnId = "todo" | "in_progress" | "done" | "overflow";

interface KanbanColumnProps {
  id: ColumnId;
  title: string;
  tasks: Task[];
  accentColor: string;
  emptyLabel?: string;
}

export function KanbanColumn({ id, title, tasks, accentColor, emptyLabel }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 min-h-[200px] rounded-lg border p-3 transition-colors ${
        isOver ? "border-purple-primary/50 bg-purple-primary/5" : "border-border bg-background-secondary"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="text-xs font-medium text-text-secondary">{title}</span>
        </div>
        <span className="text-xs font-mono text-text-muted">{tasks.length}</span>
      </div>

      {/* Cards */}
      {tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-text-muted text-center">{emptyLabel ?? "Vazio"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
