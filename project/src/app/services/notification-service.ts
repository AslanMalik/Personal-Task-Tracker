import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  permission = signal<NotificationPermission>('default');
  private notifiedTaskIds = new Set<number>();

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission.set(Notification.permission);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    this.permission.set(permission);
    return permission === 'granted';
  }

  sendNotification(taskId: number, title: string, body: string) {
    if (this.notifiedTaskIds.has(taskId)) return;
    
    if (this.permission() === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico' // Или любой другой значок
      });
      this.notifiedTaskIds.add(taskId);
    }
  }

  isAlreadyNotified(taskId: number): boolean {
    return this.notifiedTaskIds.has(taskId);
  }
}
