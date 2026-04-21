// task.model.ts
export interface Category {
  id: number;
  name: string;
  user?: number; // Owner ID
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface SubTask {
  id?: number;
  title: string;
  is_completed?: boolean;
  task?: number;
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  status: TaskStatus;
  category?: number | Category; // ID или объект категории
  deadline?: string;
  created_at?: string;
  subtasks?: SubTask[];
}
