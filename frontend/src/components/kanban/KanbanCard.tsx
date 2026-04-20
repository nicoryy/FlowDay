import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/api/types";

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

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    transition: isDragging ? undefined : "opacity 150ms",
  };

  const color = PRIORITY_COLOR[task.priority] ?? "#6d28d9";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="rounded-lg border border-border bg-background p-3 cursor-grab active:cursor-grabbing select-none space-y-1.5 hover:border-border/80 transition-colors"
    >
      {/* Priority stripe + title */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5 h-3.5 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <p className="text-sm text-text-primary font-medium leading-snug line-clamp-2">
          {task.title}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 pl-3">
        <span className="text-[10px] font-mono text-text-muted">{task.estimated_minutes}min</span>
        <span className="text-text-muted/40">·</span>
        <span className="text-[10px]" style={{ color }}>
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>
    </div>
  );
}
