import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardData } from '../../services/dashboard.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  data = signal<DashboardData | null>(null);
  loading = signal(true);
  error = signal('');

  profile = computed(() => this.data()?.profile);
  stats = computed(() => this.data()?.stats);
  weekChart = computed(() => this.data()?.week_chart ?? []);
  todayTasks = computed(() => this.data()?.today_tasks ?? []);
  upcoming = computed(() => this.data()?.upcoming ?? []);

  maxBarValue = computed(() => {
    const days = this.weekChart();
    return Math.max(...days.map(d => d.total), 1);
  });

  constructor(private dashboardService: DashboardService, private http: HttpClient) {}

  loadDashboard() {
    this.dashboardService.getDashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard');
        this.loading.set(false);
      },
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  toggleTaskStatus(task: any) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    this.http.patch(`http://127.0.0.1:8000/api/tasks/${task.id}/`, { status: newStatus }, { headers })
      .subscribe(() => {
        task.status = newStatus;
        this.loadDashboard();
      });
  }

  barHeight(total: number): number {
    return Math.round((total / this.maxBarValue()) * 100);
  }

  formatDeadline(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  daysUntil(iso: string | null): string {
    if (!iso) return '';
    const target = new Date(iso);
    const now = new Date();
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((targetDay.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    return `${diff}d`;
  }

  statusLabel(s: string): string {
    return s === 'done' ? 'Done' : s === 'in_progress' ? 'In progress' : 'To do';
  }
}
