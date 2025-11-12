export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  senderInfo?: {
    username: string;
    email: string;
  };
}

export interface SendMessageRequest {
  recipientId: string;
  content: string;
}
