import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { RegisterRequest } from '../../../shared/models/user.model';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  credentials: RegisterRequest = {
    username: '',
    email: '',
    password: ''
  };
  confirmPassword: string = '';
  error: string = '';
  loading: boolean = false;
  success: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get passwordsMatch(): boolean {
    return this.credentials.password === this.confirmPassword;
  }

  get isFormValid(): boolean {
    return !!(
      this.credentials.username &&
      this.credentials.email &&
      this.credentials.password &&
      this.confirmPassword &&
      this.passwordsMatch &&
      this.credentials.password.length >= 6
    );
  }

  onSubmit(): void {
    if (!this.passwordsMatch) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.credentials.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.error = '';
    this.loading = true;

    this.authService.register(this.credentials).subscribe({
      next: () => {
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/events']);
        }, 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
