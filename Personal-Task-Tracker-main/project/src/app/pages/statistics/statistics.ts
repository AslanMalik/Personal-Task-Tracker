import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  category: number | null;
  created_at: string;
}

interface PeriodStats {
  done: number;
  notDone: number;
  total: number;
}

@Component({
  selector: 'app-statistics',
  imports: [CommonModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css'
})
export class Statistics implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  tasks = signal<Task[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly dayStats = computed(() => this.calcStats('day'));
  readonly weekStats = computed(() => this.calcStats('week'));
  readonly monthStats = computed(() => this.calcStats('month'));

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
    }
  }

  private loadTasks() {
    this.http.get<Task[]>('http://localhost:8000/api/tasks/').subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load tasks.');
        this.loading.set(false);
      }
    });
  }

  private calcStats(period: 'day' | 'week' | 'month'): PeriodStats {
    const now = new Date();
    const cutoff = new Date();

    if (period === 'day') cutoff.setHours(0, 0, 0, 0);
    else if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else cutoff.setMonth(now.getMonth() - 1);

    const filtered = this.tasks().filter(t => new Date(t.created_at) >= cutoff);
    const done = filtered.filter(t => t.status === 'done').length;
    const notDone = filtered.length - done;
    return { done, notDone, total: filtered.length };
  }

  getPercent(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }

  // SVG pie chart math
  getArc(value: number, total: number): string {
    if (total === 0) return '';
    const pct = value / total;
    if (pct >= 1) return 'M 50 50 m -40 0 a 40 40 0 1 1 80 0 a 40 40 0 1 1 -80 0';
    const angle = pct * 2 * Math.PI;
    const x = 50 + 40 * Math.sin(angle);
    const y = 50 - 40 * Math.cos(angle);
    const large = pct > 0.5 ? 1 : 0;
    return `M 50 50 L 50 10 A 40 40 0 ${large} 1 ${x} ${y} Z`;
  }

  getDoneArc(stats: PeriodStats): string {
    return this.getArc(stats.done, stats.total);
  }

  getNotDoneArc(stats: PeriodStats): string {
    if (stats.total === 0) return '';
    const pct = stats.done / stats.total;
    const startAngle = pct * 2 * Math.PI;
    const sx = 50 + 40 * Math.sin(startAngle);
    const sy = 50 - 40 * Math.cos(startAngle);
    const remaining = stats.notDone / stats.total;
    if (remaining >= 1) return 'M 50 50 m -40 0 a 40 40 0 1 1 80 0 a 40 40 0 1 1 -80 0';
    const endAngle = startAngle + remaining * 2 * Math.PI;
    const ex = 50 + 40 * Math.sin(endAngle);
    const ey = 50 - 40 * Math.cos(endAngle);
    const large = remaining > 0.5 ? 1 : 0;
    return `M 50 50 L ${sx} ${sy} A 40 40 0 ${large} 1 ${ex} ${ey} Z`;
  }
}