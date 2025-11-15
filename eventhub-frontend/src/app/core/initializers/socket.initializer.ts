import { Injectable } from '@angular/core';
import { SocketService } from '../services/socket';
import { AuthService } from '../services/auth';

/**
 * Socket initializer provider
 * Connects socket globally when app starts if user is authenticated
 */
@Injectable({ providedIn: 'root' })
export class SocketInitializer {
  constructor(private socketService: SocketService, private authService: AuthService) {}

  init(): void {
    // Connect socket if user is authenticated
    if (this.authService.isAuthenticated) {
      console.log('🔌 Initializing global socket connection...');
      this.socketService.connect();
    } else {
      console.log('⏭️ Socket connection skipped: user not authenticated');
    }
  }
}
