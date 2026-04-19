export interface Category {
  id: number;
  name: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id?: number;
  title: string;
  description: string;
  status: TaskStatus;
  category?: number | Category;
  created_at?: string;
  deadline?: string | null; // ISO datetime string
}