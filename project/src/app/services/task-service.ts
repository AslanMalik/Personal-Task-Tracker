import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Task, Category, TaskStatus } from '../models/task';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  tasks = signal<Task[]>([]);
  categories = signal<Category[]>([]);

  constructor(private http: HttpClient) { }

  private getHeaders() {
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('access');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadInitialData() {
    const headers = this.getHeaders();
    this.http.get<Category[]>(`${this.apiUrl}/categories/`, { headers })
      .subscribe(data => this.categories.set(data));

    this.http.get<Task[]>(`${this.apiUrl}/tasks/`, { headers })
      .subscribe(data => this.tasks.set(data));
  }

  addTask(task: Partial<Task>): Observable<Task> {
    const headers = this.getHeaders();
    return this.http.post<Task>(`${this.apiUrl}/tasks/`, task, { headers }).pipe(
      tap(newTask => {
        this.tasks.update(prev => [newTask, ...prev]);
      })
    );
  }

  // updateTaskStatus(taskId: number, status: TaskStatus): Observable<Task> {
  //   const headers = this.getHeaders();
  //   return this.http.patch<Task>(`${this.apiUrl}/tasks/${taskId}/`, { status }, { headers }).pipe(
  //     tap(updated => {
  //       this.tasks.update(prev => prev.map(t => t.id === taskId ? updated : t));
  //     })
  //   );
  // }

  updateTaskStatus(task: Task, newStatus: TaskStatus): Observable<Task> {
    const headers = this.getHeaders();

    const payload = {
      ...task,
      status: newStatus
    };

    return this.http.put<Task>(`${this.apiUrl}/tasks/${task.id}/`, payload, { headers }).pipe(
      tap(updated => {
        this.tasks.update(prev => prev.map(t => t.id === task.id ? updated : t));
      })
    );
  }

  deleteTask(taskId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/tasks/${taskId}/`, { headers }).pipe(
      tap(() => {
        this.tasks.update(prev => prev.filter(t => t.id !== taskId));
      })
    );
  }

  addSubTask(taskId: number, title: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(`${this.apiUrl}/tasks/${taskId}/subtasks/`, { title }, { headers }).pipe(
      tap((newSt: any) => {
        this.tasks.update(tasks => {
          const taskObj = tasks.find(t => t.id === taskId);
          if (taskObj) {
            taskObj.subtasks = taskObj.subtasks || [];
            taskObj.subtasks.push(newSt);
          }
          return [...tasks];
        });
      })
    );
  }

  toggleSubTask(subtaskId: number, is_completed: boolean): Observable<any> {
    const headers = this.getHeaders();
    return this.http.patch(`${this.apiUrl}/subtasks/${subtaskId}/`, { is_completed }, { headers }).pipe(
      tap((updatedSt: any) => {
        this.tasks.update(tasks => {
          for (const t of tasks) {
            if (t.subtasks) {
              const idx = t.subtasks.findIndex(s => s.id === subtaskId);
              if (idx > -1) {
                t.subtasks[idx] = updatedSt;
                
                const total = t.subtasks.length;
                const completed = t.subtasks.filter(s => s.is_completed).length;

                if (total > 0) {
                  if (completed === total) {
                    t.status = 'done';
                  } else if (completed > 0) {
                    t.status = 'in_progress';
                  } else {
                    t.status = 'todo';
                  }
                }
              }
            }
          }
          return [...tasks];
        });
      })
    );
  }

  deleteSubTask(subtaskId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/subtasks/${subtaskId}/`, { headers }).pipe(
      tap(() => {
        this.tasks.update(tasks => {
          for (const t of tasks) {
            if (t.subtasks) {
              t.subtasks = t.subtasks.filter(s => s.id !== subtaskId);
            }
          }
          return [...tasks];
        });
      })
    );
  }

  addCategory(name: string): Observable<Category> {
    const headers = this.getHeaders();
    return this.http.post<Category>(`${this.apiUrl}/categories/`, { name }, { headers }).pipe(
      tap(newCat => {
        this.categories.update(prev => [...prev, newCat]);
      })
    );
  }

  deleteCategory(catId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/categories/${catId}/`, { headers }).pipe(
      tap(() => {
        this.categories.update(prev => prev.filter(c => c.id !== catId));
      })
    );
  }

  getCategoryName(cat: any): string {
    if (!cat) return 'No Category';
    if (typeof cat === 'object') return cat.name;
    const found = this.categories().find(c => c.id === cat);
    return found ? found.name : 'Category';
  }
}