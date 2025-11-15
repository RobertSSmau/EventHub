import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';
import { Conversation, Message, MessageType } from '../../shared/models/chat.model';

export interface NewMessageEvent {
  message: Message;
  conversation: Partial<Conversation> & { _id: string };
}

export interface TypingEvent {
  conversationId: string;
  userId: number;
  username?: string;
  typing: boolean;
}

export interface ReadReceiptEvent {
  conversationId: string;
  messageId: string;
  readBy: number;
}

export interface ConversationReadEvent {
  conversationId: string;
  userId: number;
}

export interface UserStatusEvent {
  userId: number;
  username?: string;
  online: boolean;
}

export interface RegistrationNotification {
  eventId: number;
  eventTitle: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  registeredAt: string;
  currentParticipants: number;
  capacity: number | null;
}

export interface UnregistrationNotification {
  eventId: number;
  eventTitle: string;
  user: {
    id: number;
    username: string;
  };
  currentParticipants: number;
  capacity: number | null;
}

export interface ReportNotification {
  reportId: number;
  reason: string;
  description: string;
  reporter: {
    id: number;
    username: string;
  };
  reportedUser?: {
    id: number;
    username: string;
  };
  reportedEvent?: {
    id: number;
    title: string;
    date: string;
    location: string;
  };
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private messageSubject = new Subject<NewMessageEvent>();
  private typingSubject = new Subject<TypingEvent>();
  private readSubject = new Subject<ReadReceiptEvent>();
  private conversationReadSubject = new Subject<ConversationReadEvent>();
  private statusSubject = new Subject<UserStatusEvent>();
  private registrationSubject = new Subject<RegistrationNotification>();
  private unregistrationSubject = new Subject<UnregistrationNotification>();
  private reportSubject = new Subject<ReportNotification>();
  private errorSubject = new Subject<string>();
  private reconnectSubject = new Subject<void>();
  private keepAliveSubscription: any;

  public message$ = this.messageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public read$ = this.readSubject.asObservable();
  public conversationRead$ = this.conversationReadSubject.asObservable();
  public status$ = this.statusSubject.asObservable();
  public registration$ = this.registrationSubject.asObservable();
  public unregistration$ = this.unregistrationSubject.asObservable();
  public report$ = this.reportSubject.asObservable();
  public errors$ = this.errorSubject.asObservable();
  public reconnect$ = this.reconnectSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(force = false): void {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('Socket connection skipped: no token available');
      return;
    }

    if (this.socket?.connected && !force) {
      return;
    }

    this.socket?.disconnect();

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'], // Prefer websocket for faster communication
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.registerCoreHandlers();
    this.startKeepAlive();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopKeepAlive();
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    // Ping every 10 minutes to keep Render app awake
    this.keepAliveSubscription = interval(10 * 60 * 1000).subscribe(() => {
      fetch(`${environment.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      }).catch(() => {
        // Ignore errors, just keeping alive
      });
    });
  }

  private stopKeepAlive(): void {
    if (this.keepAliveSubscription) {
      this.keepAliveSubscription.unsubscribe();
      this.keepAliveSubscription = null;
    }
  }

  private registerCoreHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectSubject.next();
    });
    this.socket.on('disconnect', () => console.log('Socket disconnected'));

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.errorSubject.next(error?.message ?? 'Socket error');
    });

    this.socket.on('message:new', (payload: NewMessageEvent) => {
      this.messageSubject.next(payload);
    });

    this.socket.on('typing:start', ({ conversationId, userId, username }) => {
      this.typingSubject.next({ conversationId, userId, username, typing: true });
    });

    this.socket.on('typing:stop', ({ conversationId, userId, username }) => {
      this.typingSubject.next({ conversationId, userId, username, typing: false });
    });

    this.socket.on('message:read', ({ conversationId, messageId, readBy }) => {
      this.readSubject.next({ conversationId, messageId, readBy });
    });

    this.socket.on('conversation:read', ({ conversationId, userId }) => {
      this.conversationReadSubject.next({ conversationId, userId });
    });

    this.socket.on('user:online', ({ userId, username }) => {
      this.statusSubject.next({ userId, username, online: true });
    });

    this.socket.on('user:offline', ({ userId }) => {
      this.statusSubject.next({ userId, online: false });
    });

    // 🔔 Notification handlers with debug logs
    this.socket.on('event:new_registration', (payload: RegistrationNotification) => {
      console.log('📨 Socket ricevuto: event:new_registration', payload);
      this.registrationSubject.next(payload);
    });

    this.socket.on('event:unregistration', (payload: UnregistrationNotification) => {
      console.log('📨 Socket ricevuto: event:unregistration', payload);
      this.unregistrationSubject.next(payload);
    });

    this.socket.on('report:new', (payload: ReportNotification) => {
      console.log('📨 Socket ricevuto: report:new', payload);
      this.reportSubject.next(payload);
    });
  }

  private emit(event: string, payload: Record<string, unknown>): void {
    if (!this.socket) {
      console.warn(`Socket emit skipped (${event}): socket not initialized`);
      return;
    }
    
    // If not connected, wait for connection or emit anyway (Socket.IO handles queuing)
    if (!this.socket.connected) {
      console.log(`Socket not connected, attempting to emit ${event} anyway`);
    }
    
    this.socket.emit(event, payload);
  }

  joinConversation(conversationId: string): void {
    this.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.emit('conversation:leave', { conversationId });
  }

  sendConversationMessage(conversationId: string, content: string, type: MessageType = 'text'): void {
    if (!content.trim()) return;
    this.emit('message:send', { conversationId, content: content.trim(), type });
  }

  startTyping(conversationId: string): void {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.emit('typing:stop', { conversationId });
  }

  markMessageAsRead(messageId: string, conversationId: string): void {
    this.emit('message:read', { messageId, conversationId });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
