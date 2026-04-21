import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task-service';
import { Task, Category } from '../../models/task';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css']
})
export class Tasks implements OnInit {
  newTask: Partial<Task> = {
    title: '',
    category: undefined,
    status: 'todo',
    description: '',
    deadline: ''
  };

  newCategoryName = '';
  newSubTaskTitle: { [taskId: number]: string } = {};

  errorMessage = signal('');
  editingTask = signal<Task | null>(null);

  constructor(public taskService: TaskService) { }

  ngOnInit() {
    this.taskService.loadInitialData();
  }

  createTask() {
    if (!this.newTask.title?.trim()) return;
    this.errorMessage.set('');

    this.taskService.addTask(this.newTask).subscribe({
      next: () => {
        this.newTask = {
          title: '',
          category: undefined,
          status: 'todo',
          description: '',
          deadline: ''
        };
      },
      error: (err) => {
        console.error('Ошибка создания:', err);
        this.errorMessage.set(err.error?.error || 'Failed to create task');
      }
    });
  }

  // changeStatus(id: number, status: any) {
  //   this.taskService.updateTaskStatus(id, status).subscribe();
  // }

  changeStatus(task: Task, newStatus: any) {
    this.errorMessage.set('');
    this.taskService.updateTaskStatus(task, newStatus).subscribe({
      error: (err) => {
        console.error('Update error:', err);
        this.errorMessage.set(err.error?.error || 'Failed to update status');
      }
    });
  }

  deleteTask(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.errorMessage.set('');
      this.taskService.deleteTask(id).subscribe({
        error: (err) => {
           console.error('Ошибка удаления:', err);
           this.errorMessage.set('Failed to delete task');
        }
      });
    }
  }

  addSubTask(task: Task) {
    if (!task.id) return;
    const title = this.newSubTaskTitle[task.id];
    if (!title?.trim()) return;
    
    this.taskService.addSubTask(task.id, title).subscribe(() => {
      this.newSubTaskTitle[task.id!] = '';
    });
  }

  toggleSubTask(task: Task, subtask: any, event: any) {
    const isCompleted = event.target.checked;
    this.taskService.toggleSubTask(subtask.id, isCompleted).subscribe();
  }

  deleteSubTask(task: Task, subtask: any) {
    if (confirm('Delete subtask?')) {
      this.taskService.deleteSubTask(subtask.id).subscribe();
    }
  }

  getProgress(task: Task): string {
    if (!task.subtasks || task.subtasks.length === 0) return '';
    const completed = task.subtasks.filter(s => s.is_completed).length;
    return `(${completed}/${task.subtasks.length})`;
  }

  getProgressPercent(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(s => s.is_completed).length;
    return (completed / task.subtasks.length) * 100;
  }

  createCategory() {
    if (!this.newCategoryName.trim()) return;
    this.taskService.addCategory(this.newCategoryName).subscribe({
      next: () => this.newCategoryName = '',
      error: (err) => console.error('Ошибка создания категории:', err)
    });
  }

  deleteCategory(id: number) {
    if (confirm('Delete this category? Tasks using it will remain uncategorized.')) {
      this.taskService.deleteCategory(id).subscribe({
        error: (err) => console.error('Ошибка удаления категории:', err)
      });
    }
  }

  startEdit(task: Task) {
    this.editingTask.set({ ...task });
  }

  cancelEdit() {
    this.editingTask.set(null);
  }

  saveEdit() {
    const task = this.editingTask();
    if (!task || !task.id) return;
    this.errorMessage.set('');

    this.taskService.updateTaskStatus(task, task.status).subscribe({
      next: () => this.editingTask.set(null),
      error: (err) => {
        console.error('Save error:', err);
        this.errorMessage.set(err.error?.error || 'Failed to save changes');
      }
    });
  }
}