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
      next: (response) => {
        console.log('Email verificata:', response);
        this.status = 'success';
        this.message = response.message;
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Errore verifica:', error);
        this.status = 'error';
        this.message = error.error?.message || 'Verification failed';
      }
    });
  }
}
