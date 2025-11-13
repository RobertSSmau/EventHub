import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import {
  Conversation,
  PaginatedMessages,
  SendMessageRequest,
  Message,
} from '../../shared/models/chat.model';

interface DirectConversationPayload {
  otherUserId: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  constructor(private api: ApiService) {}

  getConversations(): Observable<Conversation[]> {
    return this.api.get<Conversation[]>('/chat/conversations');
  }

  createDirectConversation(payload: DirectConversationPayload): Observable<Conversation> {
    return this.api.post<Conversation>('/chat/conversations/direct', payload);
  }

  joinEventConversation(eventId: number): Observable<Conversation> {
    return this.api.post<Conversation>(`/chat/conversations/event/${eventId}`, {});
  }

  getMessages(
    conversationId: string,
    params?: { limit?: number; before?: string }
  ): Observable<PaginatedMessages> {
    return this.api.get<PaginatedMessages>(`/chat/conversations/${conversationId}/messages`, params);
  }

  sendMessage(conversationId: string, payload: SendMessageRequest): Observable<Message> {
    return this.api.post<Message>(`/chat/conversations/${conversationId}/messages`, payload);
  }

  markConversationAsRead(conversationId: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/chat/conversations/${conversationId}/read`, {});
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.api.patch<Message>(`/chat/messages/${messageId}`, { content });
  }

  deleteMessage(messageId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/chat/messages/${messageId}`);
  }

  getOnlineStatus(userIds: number[]): Observable<Array<{ userId: number; isOnline: boolean }>> {
    return this.api.get<Array<{ userId: number; isOnline: boolean }>>('/chat/online', {
      userIds: userIds.join(','),
    });
  }
}
