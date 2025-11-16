import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { alreadyLoggedInGuard } from './core/guards/already-logged-in.guard';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { AuthCallback } from './features/auth/auth-callback/auth-callback';
import { VerifyEmail } from './features/auth/verify-email/verify-email';
import { ResetPassword } from './features/auth/reset-password/reset-password';
import { EventList } from './features/events/event-list/event-list';
import { UserDashboard } from './features/dashboard/user/user-dashboard';
import { AdminDashboard } from './features/dashboard/admin/admin-dashboard';
import { ChatPage } from './features/chat/chat-page';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [alreadyLoggedInGuard] },
  { path: 'register', component: Register, canActivate: [alreadyLoggedInGuard] },
  { path: 'auth/callback', component: AuthCallback },
  { path: 'auth/verify-email/:token', component: VerifyEmail },
  { path: 'auth/reset-password/:token', component: ResetPassword },
  { 
    path: 'events', 
    component: EventList
  },
  { 
    path: 'dashboard',
    component: UserDashboard,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'chat',
    component: ChatPage,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];
