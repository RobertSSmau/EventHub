import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { SocketService } from '../../../core/services/socket';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
})
export class AuthCallback implements OnInit {
  currentUrl = '';
  hasSession = false;
  status = 'loading';
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private api: ApiService,
    private socketService: SocketService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUrl = window.location.href;
    console.log('AuthCallback component initialized');
    console.log('Current URL:', this.currentUrl);
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    this.hasSession = !!sessionId;
    console.log('Session ID from URL:', sessionId ? `present (${sessionId})` : 'missing');

    if (sessionId) {
      console.log('Fetching OAuth data for session:', sessionId);
      this.fetchOAuthData(sessionId);
    } else {
      console.error('Missing session ID in OAuth callback');
      this.status = 'error';
      this.errorMessage = 'Missing session information. Please try logging in again.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }
  }

  private fetchOAuthData(sessionId: string): void {
    // Timeout protection: if fetch takes more than 10 seconds, something is wrong
    const timeoutHandle = setTimeout(() => {
      console.error('OAuth data fetch timeout after 10 seconds');
      this.status = 'error';
      this.errorMessage = 'Login process timed out. Please try again.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }, 10000);

    this.api.get<{ token: string; user: User }>(`/auth/oauth-data/${sessionId}`).subscribe({
      next: (authData) => {
        clearTimeout(timeoutHandle);
        console.log('OAuth data received successfully:', authData);
        
        // Store authentication data
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        // Access the BehaviorSubject correctly
        if (this.authService['currentUserSubject']) {
          this.authService['currentUserSubject'].next(authData.user);
        }
        
        this.status = 'success';
        console.log('Authentication data stored, redirecting...');
        
        // 🔌 Connect socket after Google login
        console.log('🔌 Connecting socket after Google authentication...');
        this.socketService.connect(true);
        
        // 🔔 Initialize notifications for this user
        console.log('🔔 Initializing notifications for Google user...');
        this.notificationService.initialize().then(() => {
          console.log('✅ Notifications initialized successfully');
        }).catch(err => {
          console.error('❌ Error initializing notifications:', err);
        });
        
        // Redirect to dashboard
        const redirect = authData.user.role === 'ADMIN' ? '/admin' : '/dashboard';
        console.log('Redirecting to:', redirect);
        
        setTimeout(() => {
          this.router.navigate([redirect]);
        }, 500); // Reduced timeout for faster redirect
      },
      error: (error) => {
        clearTimeout(timeoutHandle);
        console.error('Error fetching OAuth data:', error);
        console.error('Error details:', error.error);
        console.error('HTTP Status:', error.status);
        
        this.status = 'error';
        this.errorMessage = error.error?.message || 'Authentication failed. Please try again.';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }
}
