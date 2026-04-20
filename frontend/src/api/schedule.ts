import { api } from "./client";
import type { ScheduleRequest, ScheduleResponse } from "./types";

export const scheduleApi = {
  generate: (payload: ScheduleRequest) =>
    api.post<ScheduleResponse>("/schedule", payload),
  get: (date: string) => api.get<ScheduleResponse>(`/schedule/${date}`),
  delete: (date: string) => api.delete(`/schedule/${date}`),
};
