import { Injectable } from '@angular/core';
import { SocketService } from '../services/socket';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notification.service';

/**
 * Socket initializer provider
 * Connects socket globally when app starts if user is authenticated
 */
@Injectable({ providedIn: 'root' })
export class SocketInitializer {
  constructor(
    private socketService: SocketService, 
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async init(): Promise<void> {
    // Only connect if user is already authenticated from localStorage
    const token = this.authService.getToken();
    const isAuthenticated = this.authService.isAuthenticated;
    
    if (token && isAuthenticated) {
      console.log('🔌 User already authenticated, connecting socket...');
      this.socketService.connect();
      
      console.log('🔔 Initializing notifications for existing session...');
      await this.notificationService.initialize();
    } else {
      console.log('⏭️ Socket connection skipped: user not authenticated (will connect on login)');
    }
  }
}
