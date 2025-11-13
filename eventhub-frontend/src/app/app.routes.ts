import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { EventList } from './features/events/event-list/event-list';
import { UserDashboard } from './features/dashboard/user/user-dashboard';
import { AdminDashboard } from './features/dashboard/admin/admin-dashboard';
import { ChatPage } from './features/chat/chat-page';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
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
