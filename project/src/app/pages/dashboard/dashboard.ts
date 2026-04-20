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

  // Продвинутая статистика по времени
  dayStats = computed(() => this.getStatsForRange('day'));
  weekStats = computed(() => this.getStatsForRange('week'));
  monthStats = computed(() => this.getStatsForRange('month'));

  private getStatsForRange(range: 'day' | 'week' | 'month') {
    const now = new Date();
    const tasks = this.taskService.tasks().filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      
      if (range === 'day') {
        return d.toDateString() === now.toDateString();
      } else if (range === 'week') {
        const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
        const monday = new Date(now.setDate(first));
        monday.setHours(0,0,0,0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 7);
        return d >= monday && d < sunday;
      } else {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percent };
  }

  upcomingTasks = computed(() => {
    const now = new Date();
    return this.taskService.tasks()
      .filter(t => t.deadline && new Date(t.deadline) > now && t.status !== 'done')
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);
  });

  ngOnInit() {
    this.taskService.loadInitialData();
  }
}