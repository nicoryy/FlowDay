import { api } from "./client";
import type { UserConfig, UserConfigUpdate } from "./types";

export const configApi = {
  get: () => api.get<UserConfig>("/config"),
  update: (payload: UserConfigUpdate) => api.patch<UserConfig>("/config", payload),
};
