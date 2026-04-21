import type { PriorityStat } from "@/api/types";

const PRIORITY_COLOR: Record<number, string> = {
  1: "#ef4444",
  2: "#f59e0b",
  3: "#22c55e",
};

interface PriorityBreakdownProps {
  data: PriorityStat[];
}

export function PriorityBreakdown({ data }: PriorityBreakdownProps) {
  const maxDone = Math.max(...data.map((d) => d.done), 1);

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted uppercase tracking-wide">Por prioridade</p>
      {data.map((item) => (
        <div key={item.priority} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: PRIORITY_COLOR[item.priority] }}
              />
              <span className="text-text-secondary">{item.label}</span>
            </div>
            <span className="font-mono text-text-muted">
              {item.done} concluída{item.done !== 1 ? "s" : ""}
              {item.abandoned > 0 && (
                <span className="text-red-400/70"> · {item.abandoned} abandon.</span>
              )}
              {item.total_minutes > 0 && ` · ${item.total_minutes}min`}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-background-tertiary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.done / maxDone) * 100}%`,
                backgroundColor: PRIORITY_COLOR[item.priority],
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
