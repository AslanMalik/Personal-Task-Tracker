import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { filter, interval } from 'rxjs';
import { TaskService } from './services/task-service';
import { NotificationService } from './services/notification-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('personal_task_tracker');
  private router = inject(Router);
  private taskService = inject(TaskService);
  private notificationService = inject(NotificationService);
  showNavbar: boolean = true;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const hideOn = ['/login', '/register', '/'];
      this.showNavbar = !hideOn.includes(event.urlAfterRedirects);
    });

    // Инициализация уведомлений
    this.initNotifications();
  }

  async initNotifications() {
    await this.notificationService.requestPermission();
    
    // Проверка дедлайнов каждую минуту
    interval(60000).subscribe(() => {
      this.checkDeadlines();
    });
    
    // Также проверим сразу при запуске
    setTimeout(() => this.checkDeadlines(), 5000);
  }

  checkDeadlines() {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
    
    console.log(`Checking deadlines at ${now.toLocaleTimeString()}... Found ${this.taskService.tasks().length} tasks.`);

    this.taskService.tasks().forEach(task => {
      if (!task.deadline || task.status === 'done' || task.id === undefined) return;

      const deadlineDate = new Date(task.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      console.log(`Task: "${task.title}", Deadline: ${deadlineDate.toLocaleString()}, Diff: ${diffMins} mins`);

      // Если дедлайн в ближайшие 30 минут и еще не прошел
      if (deadlineDate > now && deadlineDate <= thirtyMinutesFromNow) {
        if (!this.notificationService.isAlreadyNotified(task.id)) {
          console.log(`Triggering notification for task ${task.id}`);
          this.notificationService.sendNotification(
            task.id,
            'Deadline Approaching!',
            `Task "${task.title}" is due at ${deadlineDate.toLocaleTimeString()}`
          );
        }
      }
    });
  }
}
