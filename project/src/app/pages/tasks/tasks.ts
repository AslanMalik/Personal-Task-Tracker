import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task-service';
import { Task } from '../../models/task';

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
    description: ''
  };

  constructor(public taskService: TaskService) { }

  ngOnInit() {
    this.taskService.loadInitialData();
  }

  createTask() {
    if (!this.newTask.title?.trim()) return;

    this.taskService.addTask(this.newTask).subscribe({
      next: () => {
        this.newTask = {
          title: '',
          category: undefined,
          status: 'todo',
          description: ''
        };
      },
      error: (err) => console.error('Ошибка создания:', err)
    });
  }

  // changeStatus(id: number, status: any) {
  //   this.taskService.updateTaskStatus(id, status).subscribe();
  // }

  changeStatus(task: Task, newStatus: any) {
    this.taskService.updateTaskStatus(task, newStatus).subscribe({
      error: (err) => {
        console.error('Update error:', err);
        alert('Failed to update status. Check if all required fields are present.');
      }
    });
  }

  deleteTask(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        error: (err) => console.error('Ошибка удаления:', err)
      });
    }
  }

  getCategoryName(cat: any): string {
    if (!cat) return 'No Category';
    if (typeof cat === 'object') return cat.name;
    const found = this.taskService.categories().find(c => c.id === cat);
    return found ? found.name : 'Category';
  }
}