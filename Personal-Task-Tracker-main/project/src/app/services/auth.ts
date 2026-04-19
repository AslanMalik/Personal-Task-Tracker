import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthTokens {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api';

  login(username: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiUrl}/login/`, { username, password });
  }

  register(username: string, email:string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiUrl}/register/`, { username, email, password });
  }

  logout(refresh: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout/`, { refresh });
  }
}