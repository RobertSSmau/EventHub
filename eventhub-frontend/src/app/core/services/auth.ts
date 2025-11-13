import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { ApiService } from './api';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiService) {
    this.loadUserFromStorage();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): Observable<void> {
    return this.api.post<{ message: string }>('/auth/logout', {}).pipe(
      catchError((error) => {
        console.warn('Logout request failed, clearing local state only.', error);
        return of({ message: 'local logout' });
      }),
      finalize(() => this.clearAuthState()),
      map(() => void 0)
    );
  }

  resendVerification(email: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/resend-verification', { email });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/forgot-password', { email });
  }

  resetPassword(payload: { token: string; newPassword: string }): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/reset-password', payload);
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.api.get<{ message: string }>(`/auth/verify-email/${token}`);
  }

  getPasswordRequirements(): Observable<{ requirements: string[]; pattern: string }> {
    return this.api.get<{ requirements: string[]; pattern: string }>('/auth/password-requirements');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.clearAuthState();
      }
    }
  }

  private clearAuthState(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
}
