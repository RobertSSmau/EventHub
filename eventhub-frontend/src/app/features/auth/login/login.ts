import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { LoginRequest, AuthResponse } from '../../../shared/models/user.model';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };
  error = '';
  loading = false;
  forgotPasswordOpen = false;
  passwordResetEmail = '';
  passwordResetMessage = '';
  passwordResetError = '';
  passwordResetLoading = false;
  resendEmail = '';
  resendMessage = '';
  resendError = '';
  resendLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    this.authService.login(this.credentials).subscribe({
      next: (response: AuthResponse) => {
        const redirect = response.user.role === 'ADMIN' ? '/admin' : '/dashboard';
        this.router.navigate([redirect]);
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  toggleForgotPassword(): void {
    this.forgotPasswordOpen = !this.forgotPasswordOpen;
    if (this.forgotPasswordOpen && !this.passwordResetEmail) {
      this.passwordResetEmail = this.credentials.email;
    }
  }

  requestPasswordReset(): void {
    if (!this.passwordResetEmail) {
      this.passwordResetError = 'Please enter an email address';
      return;
    }

    this.passwordResetLoading = true;
    this.passwordResetError = '';
    this.passwordResetMessage = '';

    this.authService.forgotPassword(this.passwordResetEmail).subscribe({
      next: (res) => {
        this.passwordResetMessage = res.message;
      },
      error: (err) => {
        this.passwordResetError = err.error?.message || 'Unable to send reset email';
      },
      complete: () => {
        this.passwordResetLoading = false;
      }
    });
  }

  resendVerificationEmail(): void {
    if (!this.resendEmail) {
      this.resendError = 'Please enter an email address';
      return;
    }

    this.resendLoading = true;
    this.resendError = '';
    this.resendMessage = '';

    this.authService.resendVerification(this.resendEmail).subscribe({
      next: (res) => {
        this.resendMessage = res.message;
      },
      error: (err) => {
        this.resendError = err.error?.message || 'Unable to resend verification email';
      },
      complete: () => {
        this.resendLoading = false;
      }
    });
  }
}
