import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task, Category, TaskStatus } from '../models/task';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  tasks = signal<Task[]>([]);
  categories = signal<Category[]>([]);

  constructor(public http: HttpClient) {}

  loadTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/`).pipe(
      tap(data => this.tasks.set(data))
    );
  }

  loadInitialData() {
    this.http.get<Category[]>(`${this.apiUrl}/categories/`)
      .subscribe(data => this.categories.set(data));
    this.loadTasks().subscribe();
  }

  addTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/`, task).pipe(
      tap(newTask => this.tasks.update(prev => [newTask, ...prev]))
    );
  }

  updateTaskStatus(task: Task, newStatus: TaskStatus): Observable<Task> {
    const payload = { ...task, status: newStatus };
    return this.http.put<Task>(`${this.apiUrl}/tasks/${task.id}/`, payload).pipe(
      tap(updated => this.tasks.update(prev => prev.map(t => t.id === task.id ? updated : t)))
    );
  }

  deleteTask(taskId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${taskId}/`).pipe(
      tap(() => this.tasks.update(prev => prev.filter(t => t.id !== taskId)))
    );
  }
}