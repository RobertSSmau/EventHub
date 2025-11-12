import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';
import { Message } from '../../shared/models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private messageSubject = new Subject<Message>();
  public message$ = this.messageSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('message', (message: Message) => {
      this.messageSubject.next(message);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(recipientId: string, content: string): void {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', { recipientId, content });
    }
  }

  markAsRead(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('markAsRead', { conversationId });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
