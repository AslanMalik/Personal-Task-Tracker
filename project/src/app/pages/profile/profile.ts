import { Component, OnInit, inject, signal, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TaskService } from '../../services/task-service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private http       = inject(HttpClient);
  public  taskService = inject(TaskService);
  private authService = inject(Auth);

  private apiUrl = 'http://127.0.0.1:8000/api';

  username = signal('User');
  email    = signal('user@example.com');

  totalTasks     = computed(() => this.taskService.tasks().length);
  completedTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'done').length);

  // Which panel is open: 'edit' | 'password' | null
  activePanel = signal<'edit' | 'password' | null>(null);

  // Edit profile form
  editUsername = '';
  editEmail    = '';
  editLoading  = signal(false);
  editSuccess  = signal('');
  editError    = signal('');

  // Change password form
  oldPassword  = '';
  newPassword  = '';
  newPassword2 = '';
  pwLoading    = signal(false);
  pwSuccess    = signal('');
  pwError      = signal('');

  private getHeaders(): HttpHeaders {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.username.set(localStorage.getItem('username') || 'User');
      this.email.set(localStorage.getItem('email') || 'user@example.com');
      if (this.taskService.tasks().length === 0) {
        this.taskService.loadInitialData();
      }
    }
  }

  openPanel(panel: 'edit' | 'password') {
    if (this.activePanel() === panel) {
      this.activePanel.set(null);
      return;
    }
    this.activePanel.set(panel);
    this.editSuccess.set('');
    this.editError.set('');
    this.pwSuccess.set('');
    this.pwError.set('');

    if (panel === 'edit') {
      this.editUsername = this.username();
      this.editEmail    = this.email();
    } else {
      this.oldPassword  = '';
      this.newPassword  = '';
      this.newPassword2 = '';
    }
  }

  saveProfile() {
    if (!this.editUsername.trim()) {
      this.editError.set('Username cannot be empty');
      return;
    }
    this.editLoading.set(true);
    this.editError.set('');
    this.editSuccess.set('');

    this.http.patch<{ username: string; email: string }>(
      `${this.apiUrl}/profile/`,
      { username: this.editUsername.trim(), email: this.editEmail.trim() },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.username.set(res.username);
        this.email.set(res.email);
        localStorage.setItem('username', res.username);
        localStorage.setItem('email', res.email);
        this.editSuccess.set('Profile updated successfully!');
        this.editLoading.set(false);
      },
      error: (err) => {
        this.editError.set(err.error?.error || 'Failed to update profile');
        this.editLoading.set(false);
      },
    });
  }

  savePassword() {
    if (!this.oldPassword || !this.newPassword) {
      this.pwError.set('Please fill in all fields');
      return;
    }
    if (this.newPassword !== this.newPassword2) {
      this.pwError.set('New passwords do not match');
      return;
    }
    if (this.newPassword.length < 6) {
      this.pwError.set('Password must be at least 6 characters');
      return;
    }
    this.pwLoading.set(true);
    this.pwError.set('');
    this.pwSuccess.set('');

    this.http.post<{ message: string }>(
      `${this.apiUrl}/change-password/`,
      { old_password: this.oldPassword, new_password: this.newPassword },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.pwSuccess.set(res.message);
        this.pwLoading.set(false);
        this.oldPassword = this.newPassword = this.newPassword2 = '';
      },
      error: (err) => {
        this.pwError.set(err.error?.error || 'Failed to change password');
        this.pwLoading.set(false);
      },
    });
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      const refresh = localStorage.getItem('refresh');
      if (refresh) {
        this.authService.logout(refresh).subscribe({
          next: () => this.finalizeLogout(),
          error: () => this.finalizeLogout() // Still logout locally if API fails
        });
      } else {
        this.finalizeLogout();
      }
    }
  }

  private finalizeLogout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
