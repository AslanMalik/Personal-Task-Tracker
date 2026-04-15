import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../services/task-service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  public taskService = inject(TaskService);
  private platformId = inject(PLATFORM_ID);
  
  // username = localStorage.getItem('username') || 'User';
  username = signal('User');

  constructor() {
    // Проверяем, находимся ли мы в браузере
    if (isPlatformBrowser(this.platformId)) {
      const savedName = localStorage.getItem('username');
      if (savedName) {
        this.username.set(savedName);
      }
    }
  }

  // Автоматически вычисляемая статистика
  totalTasks = computed(() => this.taskService.tasks().length);
  completedTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'done').length);
  inProgressTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'in_progress').length);
  todoTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'todo').length);

  ngOnInit() {
    this.taskService.loadInitialData();
  }
}