import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-verify-email',
  imports: [],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.params['token'];
    console.log('🔍 Token verificato:', token);

    if (!token) {
      this.status = 'error';
      this.message = 'Invalid verification link';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (response: any) => {
        console.log('✅ Email verificata:', response);
        this.status = 'success';
        this.message = response.message;
        
        // Check if token provided (OAuth users get auto-login, email users go to login page)
        if (response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          console.log('🔐 OAuth user: token saved, redirecting to dashboard...');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        } else {
          // Email verification: redirect to login page
          console.log('📧 Email verified: redirecting to login page...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      },
      error: (error) => {
        console.error('❌ Verification error:', error);
        this.status = 'error';
        this.message = error.error?.message || 'Verification failed';
      }
    });
  }
}
