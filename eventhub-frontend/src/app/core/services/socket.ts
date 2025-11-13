import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
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
  private errorSubject = new Subject<string>();

  public message$ = this.messageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public read$ = this.readSubject.asObservable();
  public conversationRead$ = this.conversationReadSubject.asObservable();
  public status$ = this.statusSubject.asObservable();
  public errors$ = this.errorSubject.asObservable();

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
      transports: ['websocket', 'polling'],
    });

    this.registerCoreHandlers();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private registerCoreHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => console.log('Socket connected'));
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
  }

  private emit(event: string, payload: Record<string, unknown>): void {
    if (!this.socket?.connected) {
      this.connect(true);
    }
    if (!this.socket?.connected) {
      console.warn(`Socket emit skipped (${event}): not connected`);
      return;
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
