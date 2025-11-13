import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatApiService } from '../../core/services/chat-api.service';
import { SocketService, NewMessageEvent, TypingEvent, UserStatusEvent } from '../../core/services/socket';
import { Conversation, Message, MessageType } from '../../shared/models/chat.model';
import { AuthService } from '../../core/services/auth';
import { ReportService } from '../../core/services/report.service';
import { CreateReportRequest } from '../../shared/models/report.model';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.scss',
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild('messageList') messageList?: ElementRef<HTMLDivElement>;

  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  conversationsLoading = false;
  conversationsError = '';
  selectedConversation?: Conversation;

  messages: Message[] = [];
  messagesLoading = false;
  hasMoreMessages = false;
  messagesError = '';

  messageContent = '';
  searchTerm = '';
  typingMap = new Map<string, Map<number, { username?: string; timer?: any }>>();
  onlineUserIds = new Set<number>();

  // Report modal properties
  showReportModal = false;
  reportTarget: 'event' | 'user' | null = null;
  reportReason = '';
  reportDescription = '';
  selectedUserId: number | null = null;
  currentUserId: number | null = null;

  private subs: Subscription[] = [];
  private activeTypingTimeout?: any;

  constructor(
    private chatApi: ChatApiService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser?.id || null;
    this.socketService.connect();
    this.loadConversations();
    this.registerRealtimeHandlers();
    this.listenToQueryParams();
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
    this.typingMap.forEach((map) =>
      map.forEach((entry) => {
        if (entry.timer) clearTimeout(entry.timer);
      })
    );
  }

  private listenToQueryParams(): void {
    this.subs.push(
      this.route.queryParams.subscribe((params) => {
        const eventId = params['eventId'];
        if (eventId) {
          this.joinEventConversation(Number(eventId));
        }
      })
    );
  }

  private registerRealtimeHandlers(): void {
    this.subs.push(
      this.socketService.message$.subscribe((payload) => this.handleIncomingMessage(payload))
    );
    this.subs.push(
      this.socketService.typing$.subscribe((event) => this.handleTypingEvent(event))
    );
    this.subs.push(
      this.socketService.status$.subscribe((event) => this.handleStatusEvent(event))
    );
    this.subs.push(
      this.socketService.read$.subscribe(({ messageId, conversationId, readBy }) => {
        if (this.selectedConversation?._id !== conversationId) return;
        this.messages = this.messages.map((message) =>
          message._id === messageId
            ? { ...message, readBy: [...(message.readBy || []), readBy] }
            : message
        );
      })
    );
  }

  private loadConversations(): void {
    this.conversationsLoading = true;
    this.conversationsError = '';
    this.chatApi.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        this.applyConversationFilter();
      },
      error: (err) => {
        this.conversationsError = err.error?.message || 'Unable to load conversations';
      },
      complete: () => {
        this.conversationsLoading = false;
      },
    });
  }

  private applyConversationFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredConversations = [...this.conversations];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredConversations = this.conversations.filter((conversation) =>
      (conversation.displayName || '').toLowerCase().includes(term)
    );
  }

  onSearchChange(): void {
    this.applyConversationFilter();
  }

  selectConversation(conversation: Conversation): void {
    if (this.selectedConversation?._id === conversation._id) return;
    if (this.selectedConversation) {
      this.socketService.leaveConversation(this.selectedConversation._id);
    }
    this.selectedConversation = conversation;
    this.messages = [];
    this.hasMoreMessages = false;
    this.messagesError = '';
    this.socketService.joinConversation(conversation._id);
    this.loadMessages(conversation);
    this.clearTyping(conversation._id);
    this.markConversationAsRead(conversation);
  }

  loadMessages(conversation: Conversation, before?: string): void {
    this.messagesLoading = true;
    this.chatApi
      .getMessages(conversation._id, { limit: 30, before })
      .subscribe({
        next: (response) => {
          this.hasMoreMessages = response.hasMore;
          if (before) {
            this.messages = [...response.messages, ...this.messages];
          } else {
            this.messages = response.messages;
            this.scrollMessagesToBottom();
          }
        },
        error: (err) => {
          this.messagesError = err.error?.message || 'Unable to load messages';
        },
        complete: () => {
          this.messagesLoading = false;
        },
      });
  }

  loadOlderMessages(): void {
    if (!this.selectedConversation || !this.messages.length) return;
    const oldest = this.messages[0];
    this.loadMessages(this.selectedConversation, oldest.createdAt);
  }

  sendMessage(type: MessageType = 'text'): void {
    if (!this.selectedConversation || !this.messageContent.trim()) return;
    this.socketService.sendConversationMessage(
      this.selectedConversation._id,
      this.messageContent,
      type
    );
    this.messageContent = '';
    this.socketService.stopTyping(this.selectedConversation._id);
  }

  onMessageInputChange(): void {
    if (!this.selectedConversation) return;
    this.socketService.startTyping(this.selectedConversation._id);
    if (this.activeTypingTimeout) {
      clearTimeout(this.activeTypingTimeout);
    }
    this.activeTypingTimeout = setTimeout(() => {
      this.socketService.stopTyping(this.selectedConversation!._id);
    }, 1500);
  }

  private handleIncomingMessage(payload: NewMessageEvent): void {
    const { message, conversation } = payload;
    this.upsertConversation(conversation, message);

    if (this.selectedConversation?._id === message.conversationId) {
      this.messages = [...this.messages, message];
      this.scrollMessagesToBottom();
      this.socketService.markMessageAsRead(message._id, message.conversationId);
      this.markConversationAsRead(this.selectedConversation);
    } else {
      const target = this.conversations.find((c) => c._id === message.conversationId);
      if (target) {
        target.unreadCount = (target.unreadCount || 0) + 1;
      }
    }
  }

  private handleTypingEvent(event: TypingEvent): void {
    const { conversationId, userId, username, typing } = event;
    if (this.selectedConversation?._id !== conversationId) return;

    const convMap = this.typingMap.get(conversationId) ?? new Map();
    if (typing) {
      if (convMap.has(userId) && convMap.get(userId)?.timer) {
        clearTimeout(convMap.get(userId)!.timer);
      }
      const timeout = setTimeout(() => {
        convMap.delete(userId);
        if (!convMap.size) {
          this.typingMap.delete(conversationId);
        }
      }, 2000);
      convMap.set(userId, { username, timer: timeout });
      this.typingMap.set(conversationId, convMap);
    } else if (convMap.has(userId)) {
      const entry = convMap.get(userId);
      if (entry?.timer) clearTimeout(entry.timer);
      convMap.delete(userId);
      if (!convMap.size) {
        this.typingMap.delete(conversationId);
      }
    }
  }

  private handleStatusEvent(event: UserStatusEvent): void {
    if (event.online) {
      this.onlineUserIds.add(event.userId);
    } else {
      this.onlineUserIds.delete(event.userId);
    }
  }

  isOwnMessage(message: Message): boolean {
    return message.senderId === this.authService.currentUser?.id;
  }

  private upsertConversation(partial: Partial<Conversation> & { _id: string }, message?: Message): void {
    const existingIndex = this.conversations.findIndex((conv) => conv._id === partial._id);
    if (existingIndex >= 0) {
      const updated = {
        ...this.conversations[existingIndex],
        ...partial,
      };
      if (message) {
        updated.lastMessage = {
          content: message.content,
          senderId: message.senderId,
          timestamp: message.createdAt,
        };
        updated.updatedAt = message.createdAt;
      }
      this.conversations.splice(existingIndex, 1);
      this.conversations.unshift(updated);
    } else {
      const newConversation: Conversation = {
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...partial,
      } as Conversation;
      if (message) {
        newConversation.lastMessage = {
          content: message.content,
          senderId: message.senderId,
          timestamp: message.createdAt,
        };
      }
      this.conversations.unshift(newConversation);
    }
    this.applyConversationFilter();
  }

  private markConversationAsRead(conversation: Conversation): void {
    if (!conversation.unreadCount) return;
    conversation.unreadCount = 0;
    this.chatApi.markConversationAsRead(conversation._id).subscribe({
      error: () => {
        conversation.unreadCount = 1;
      },
    });
  }

  typingSummary(conversationId: string): string {
    const entries = this.typingMap.get(conversationId);
    if (!entries?.size) return '';
    const names = [...entries.values()].map((entry) => entry.username || 'Someone');
    return `${names.join(', ')} typing...`;
  }

  isUserOnline(userId?: number): boolean {
    if (!userId) return false;
    return this.onlineUserIds.has(userId);
  }

  private clearTyping(conversationId: string): void {
    const entries = this.typingMap.get(conversationId);
    if (!entries) return;
    entries.forEach((entry) => entry.timer && clearTimeout(entry.timer));
    this.typingMap.delete(conversationId);
  }

  openEventChat(eventId: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { eventId },
      queryParamsHandling: 'merge',
    });
  }

  private joinEventConversation(eventId: number): void {
    this.chatApi.joinEventConversation(eventId).subscribe({
      next: (conversation) => {
        this.upsertConversation(conversation);
        this.selectConversation(
          this.conversations.find((c) => c._id === conversation._id) || conversation
        );
        this.router.navigate([], {
          queryParams: { eventId: null },
          queryParamsHandling: 'merge',
        });
      },
      error: (err) => {
        this.conversationsError =
          err.error?.message || 'Unable to join conversation for this event';
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  openReportModal(conversation: Conversation): void {
    this.showReportModal = true;
    this.reportTarget = conversation.type === 'event_group' ? 'event' : 'user';
    this.reportReason = '';
    this.reportDescription = '';
    this.selectedUserId = null;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportTarget = null;
    this.reportReason = '';
    this.reportDescription = '';
    this.selectedUserId = null;
  }

  selectUserToReport(userId: number): void {
    this.selectedUserId = userId;
  }

  submitReport(conversation: Conversation): void {
    if (!this.reportReason.trim()) return;

    const reportData: CreateReportRequest = {
      reason: this.reportReason,
    };

    if (this.reportDescription?.trim()) {
      reportData.description = this.reportDescription.trim();
    }

    if (this.reportTarget === 'event' && conversation.eventId) {
      reportData.reported_event_id = conversation.eventId;
    } else if (this.reportTarget === 'user' && this.selectedUserId) {
      reportData.reported_user_id = this.selectedUserId;
    } else {
      console.error('Invalid report data: missing target ID');
      return;
    }

    this.reportService.createReport(reportData).subscribe({
      next: () => {
        this.closeReportModal();
        // Could show a success message here
      },
      error: (err) => {
        console.error('Failed to submit report:', err);
        // Could show an error message here
      }
    });
  }

  private scrollMessagesToBottom(): void {
    queueMicrotask(() => {
      if (this.messageList) {
        this.messageList.nativeElement.scrollTop =
          this.messageList.nativeElement.scrollHeight;
      }
    });
  }

  trackByMessage = (_: number, message: Message) => message._id;
}
