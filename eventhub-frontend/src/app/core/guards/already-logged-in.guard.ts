import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const alreadyLoggedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already logged in, redirect to dashboard
  if (authService.isLoggedIn()) {
    const user = authService.getCurrentUser();
    const redirect = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
    console.log('User already logged in, redirecting to:', redirect);
    router.navigate([redirect]);
    return false;
  }

  return true;
};
