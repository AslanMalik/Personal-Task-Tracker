import { Component, OnInit } from '@angular/core';
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
          description: '',
          deadline: ''
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
}