import { User } from './user.model';

export type ConversationType = 'direct' | 'event_group';
export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Conversation {
  _id: string;
  type: ConversationType;
  participants: number[];
  participantsInfo?: Array<Pick<User, 'id' | 'username' | 'email'>>;
  otherUser?: Pick<User, 'id' | 'username' | 'email'> | null;
  eventId?: number;
  name?: string;
  displayName?: string;
  lastMessage?: LastMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LastMessage {
  content: string;
  senderId: number;
  timestamp: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: number;
  content: string;
  type: MessageType;
  fileUrl?: string;
  readBy?: number[];
  sender?: Pick<User, 'id' | 'username' | 'email'> | null;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMessages {
  messages: Message[];
  hasMore: boolean;
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
}
