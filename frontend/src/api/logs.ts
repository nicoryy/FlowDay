import { api } from "./client";
import type { ExecutionLog, ExecutionLogCreate, ExecutionLogUpdate } from "./types";

export const logsApi = {
  start: (payload: ExecutionLogCreate) => api.post<ExecutionLog>("/logs", payload),
  update: (id: string, payload: ExecutionLogUpdate) =>
    api.patch<ExecutionLog>(`/logs/${id}`, payload),
  list: (params?: { date?: string; task_id?: string }) => {
    const qs = new URLSearchParams();
    if (params?.date) qs.set("date", params.date);
    if (params?.task_id) qs.set("task_id", params.task_id);
    return api.get<ExecutionLog[]>(`/logs${qs.toString() ? `?${qs}` : ""}`);
  },
  getActive: (taskId: string) =>
    api.get<ExecutionLog | null>(`/logs/active/${taskId}`),
};
