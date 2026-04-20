import { api } from "./client";
import type { Task, TaskCreate, TaskUpdate } from "./types";

export const tasksApi = {
  list: (params?: { status?: string; priority?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.priority != null) qs.set("priority", String(params.priority));
    const query = qs.toString();
    return api.get<Task[]>(`/tasks${query ? `?${query}` : ""}`);
  },
  get: (id: string) => api.get<Task>(`/tasks/${id}`),
  create: (payload: TaskCreate) => api.post<Task>("/tasks", payload),
  update: (id: string, payload: TaskUpdate) => api.patch<Task>(`/tasks/${id}`, payload),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};
