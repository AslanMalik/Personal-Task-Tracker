import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  private authService = inject(Auth);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  errorMessage = signal('');

  register() {
    this.authService.register(this.username, this.email, this.password).subscribe({
      next: (tokens) => {
        localStorage.setItem('access', tokens.access);
        localStorage.setItem('refresh', tokens.refresh);
        localStorage.setItem('email', this.email);
        localStorage.setItem('username', this.username);

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(err?.error?.error ?? 'Registration failed');
      }
    });
  }
}