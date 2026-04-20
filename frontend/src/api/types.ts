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
