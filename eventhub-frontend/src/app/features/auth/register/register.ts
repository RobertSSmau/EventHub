import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { RegisterRequest } from '../../../shared/models/user.model';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html'
})
export class Register implements OnInit {
  credentials: RegisterRequest = {
    username: '',
    email: '',
    password: ''
  };
  confirmPassword: string = '';
  error: string = '';
  loading: boolean = false;
  success: boolean = false;
  passwordRequirements: string[] = [];
  passwordPattern = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getPasswordRequirements().subscribe({
      next: (res) => {
        this.passwordRequirements = res.requirements;
        this.passwordPattern = res.pattern;
      },
      error: () => {
        this.passwordRequirements = [
          'At least 8 characters',
          'One uppercase letter',
          'One lowercase letter',
          'One number',
          'One special character',
        ];
      }
    });
  }

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
      this.credentials.password.length >= 8
    );
  }

  onSubmit(): void {
    if (!this.passwordsMatch) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.credentials.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }

    this.error = '';
    this.loading = true;

    this.authService.register(this.credentials).subscribe({
      next: () => {
        this.success = true;
        // Non reindirizzare automaticamente - l'utente deve verificare l'email
        // setTimeout(() => {
        //   this.router.navigate(['/dashboard']);
        // }, 1500);
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
