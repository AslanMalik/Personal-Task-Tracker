import { Component, OnInit, inject, signal, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  public taskService = inject(TaskService);

  // Сигналы для данных пользователя
  username = signal('User');
  email = signal('No email provided');

  // Статистика для карточек
  totalTasks = computed(() => this.taskService.tasks().length);
  completedTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'done').length);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.username.set(localStorage.getItem('username') || 'User');
      this.email.set(localStorage.getItem('email') || 'user@example.com');
      
      // Загружаем данные, если они еще не загружены
      if (this.taskService.tasks().length === 0) {
        this.taskService.loadInitialData();
      }
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
      this.router.navigate(['/login']);
    }
  }
}