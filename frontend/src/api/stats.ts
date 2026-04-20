import { api } from "./client";
import type { StatsResponse, StatsPeriod } from "./types";

export const statsApi = {
  get: (params?: { period?: StatsPeriod; date?: string }): Promise<StatsResponse> => {
    const qs = new URLSearchParams();
    if (params?.period) qs.set("period", params.period);
    if (params?.date) qs.set("date", params.date);
    const query = qs.toString();
    return api.get<StatsResponse>(`/stats${query ? `?${query}` : ""}`);
  },
};
