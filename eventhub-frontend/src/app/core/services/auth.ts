import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { ApiService } from './api';
import { SocketService } from './socket';
import { NotificationService } from './notification.service';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private socketService: SocketService | null = null;
  private notificationService: NotificationService | null = null;

  constructor(private api: ApiService, private injector: Injector) {
    this.loadUserFromStorage();
  }

  private getSocketService(): SocketService {
    if (!this.socketService) {
      this.socketService = this.injector.get(SocketService);
    }
    return this.socketService;
  }

  private getNotificationService(): NotificationService {
    if (!this.notificationService) {
      this.notificationService = this.injector.get(NotificationService);
    }
    return this.notificationService;
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
      tap(async response => await this.handleAuthResponse(response))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap(async response => await this.handleAuthResponse(response))
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

  private clearAuthState(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    
    // 🔌 Disconnect socket when user logs out
    console.log('🔌 User logged out, disconnecting socket...');
    this.getSocketService().disconnect();
    
    // 🔔 Reset notifications
    console.log('🔔 Resetting notifications...');
    this.getNotificationService().reset();
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

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async handleAuthResponse(response: AuthResponse): Promise<void> {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    
    // 🔌 Connect socket immediately after successful login/register
    console.log('🔌 User authenticated, connecting socket...');
    this.getSocketService().connect();
    
    // 🔔 Initialize notifications for this user
    console.log('🔔 Initializing notifications for user...');
    await this.getNotificationService().initialize();
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

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
