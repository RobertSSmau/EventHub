import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss']
})
export class ResetPassword implements OnInit {
  newPassword = '';
  confirmPassword = '';
  error = '';
  loading = false;
  invalidToken = '';
  resetSuccess = '';
  token: string | null = null;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.invalidToken = 'Invalid or missing reset token. Please request a new password reset.';
    }
  }

  onSubmit(): void {
    if (!this.token) {
      this.error = 'Invalid token';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.newPassword.length < 8) {
      this.error = 'Password must be at least 8 characters long';
      return;
    }

    this.error = '';
    this.loading = true;

    this.authService.resetPassword({ token: this.token, newPassword: this.newPassword }).subscribe({
      next: (res) => {
        this.resetSuccess = res.message || 'Password reset successfully! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to reset password. Please try again.';
        this.loading = false;
      }
    });
  }
}
