import { Component, OnInit, OnDestroy, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../services/task-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, OnDestroy {
  public taskService = inject(TaskService);
  private platformId = inject(PLATFORM_ID);

  username = signal('User');
  showAlarm = signal(false);
  private checkInterval: any;
  private audioCtx: AudioContext | null = null;
  private sirenNodes: any[] = [];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedName = localStorage.getItem('username');
      if (savedName) this.username.set(savedName);
    }
  }

  totalTasks      = computed(() => this.taskService.tasks().length);
  completedTasks  = computed(() => this.taskService.tasks().filter(t => t.status === 'done').length);
  inProgressTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'in_progress').length);
  todoTasks       = computed(() => this.taskService.tasks().filter(t => t.status === 'todo').length);

  expiredTasks = computed(() =>
    this.taskService.tasks().filter(t =>
      t.deadline &&
      new Date(t.deadline).getTime() < Date.now() &&
      t.status !== 'done'
    )
  );

  ngOnInit() {
    this.taskService.loadInitialData();

    if (isPlatformBrowser(this.platformId)) {
      this.requestNotificationPermission();
      setTimeout(() => {
        this.checkExpiredAndAlert();
        this.checkInterval = setInterval(() => this.checkExpiredAndNotify(), 60000);
      }, 1500);
    }
  }

  ngOnDestroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.stopSiren();
  }

  private requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private checkExpiredAndAlert() {
    const expired = this.expiredTasks();
    if (expired.length === 0) return;
    this.showAlarm.set(true);
    this.playSiren();
    this.sendNotification(expired.length);
    setTimeout(() => this.dismissAlarm(), 5000);
  }

  private checkExpiredAndNotify() {
    const expired = this.expiredTasks();
    if (expired.length > 0) this.sendNotification(expired.length);
  }

  dismissAlarm() {
    this.showAlarm.set(false);
    this.stopSiren();
  }

  private sendNotification(count: number) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ Overdue Tasks!', {
        body: `You have ${count} expired task${count > 1 ? 's' : ''} that need attention.`,
        icon: '/favicon.ico',
        tag: 'expired-tasks'
      });
    }
  }

  playSiren() {
    try {
      this.audioCtx = new AudioContext();
      const ctx = this.audioCtx;
      const cycleDuration = 0.6;
      const cycles = Math.floor(5 / cycleDuration);
      for (let i = 0; i < cycles; i++) {
        const t = ctx.currentTime + i * cycleDuration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(1200, t + cycleDuration / 2);
        osc.frequency.linearRampToValueAtTime(600, t + cycleDuration);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.5, t + cycleDuration / 2);
        gain.gain.linearRampToValueAtTime(0.3, t + cycleDuration);
        osc.type = 'sawtooth';
        osc.start(t);
        osc.stop(t + cycleDuration);
        this.sirenNodes.push(osc);
      }
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }

  stopSiren() {
    this.sirenNodes.forEach(n => { try { n.stop(); } catch {} });
    this.sirenNodes = [];
    if (this.audioCtx) { this.audioCtx.close(); this.audioCtx = null; }
  }
}