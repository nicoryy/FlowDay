export type TaskStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "done"
  | "skipped"
  | "overflow";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  priority: 1 | 2 | 3;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  estimated_minutes: number;
  priority?: 1 | 2 | 3;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  estimated_minutes?: number;
  priority?: 1 | 2 | 3;
  status?: TaskStatus;
}

export interface ScheduledBlock {
  id: string;
  task_id: string;
  task_title: string;
  task_status: TaskStatus;
  estimated_minutes: number;
  priority: number;
  planned_start: string;
  planned_end: string;
  position: number;
}

export interface ScheduleResponse {
  session_id: string;
  date: string;
  work_start: string;
  work_end: string;
  blocks: ScheduledBlock[];
  overflow: Task[];
}

export interface ScheduleRequest {
  date: string;
  work_start?: string;
  work_end?: string;
}

export interface ExecutionLog {
  id: string;
  task_id: string;
  work_session_id: string | null;
  actual_start: string | null;
  actual_end: string | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface ExecutionLogCreate {
  task_id: string;
  work_session_id?: string | null;
  actual_start?: string | null;
}

export interface ExecutionLogUpdate {
  actual_end?: string | null;
  completed?: boolean;
  notes?: string | null;
}

export interface UserConfig {
  id: number;
  default_work_start: string;
  default_work_end: string;
  break_duration_min: number;
  break_interval_min: number;
  timezone: string;
  notifications_enabled: boolean;
}

export interface UserConfigUpdate {
  default_work_start?: string;
  default_work_end?: string;
  break_duration_min?: number;
  break_interval_min?: number;
  timezone?: string;
  notifications_enabled?: boolean;
}
