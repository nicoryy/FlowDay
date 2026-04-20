import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/toast";

const ICON = {
  success: <CheckCircle size={16} className="text-success flex-shrink-0" />,
  error: <XCircle size={16} className="text-error flex-shrink-0" />,
  info: <Info size={16} className="text-purple-accent flex-shrink-0" />,
};

export function Toaster() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-background-secondary px-4 py-3 shadow-lg animate-in slide-in-from-right-2"
        >
          {ICON[t.type]}
          <span className="text-sm text-text-primary flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
