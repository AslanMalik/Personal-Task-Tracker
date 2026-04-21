import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardProfile {
  username: string;
  email: string;
  initials: string;
  current_streak?: number;
}

export interface DashboardStats {
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
  rate: number;
}

export interface WeekDay {
  day: string;
  total: number;
  completed: number;
  is_today: boolean;
}

export interface DashboardTask {
  id: number;
  title: string;
  status: string;
  deadline: string | null;
  category: string | null;
}

export interface DashboardData {
  profile: DashboardProfile;
  stats: DashboardStats;
  week_chart: WeekDay[];
  today_tasks: DashboardTask[];
  upcoming: DashboardTask[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard-data/`, {
      headers: this.getHeaders(),
    });
  }
}
