import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      @for (notification of notifications; track notification.id) {
        <div 
          class="notification-toast"
          [class]="'notification-' + notification.type + ' ' + 'toast-' + notification.color"
          [class.notification-read]="notification.read"
          (click)="onNotificationClick(notification)"
        >
          @if (!notification.read) {
            <div class="notification-unread-indicator"></div>
          }
          <div class="notification-content">
            <span class="notification-icon">{{ notification.icon }}</span>
            <div class="notification-text">
              <p class="notification-title">{{ notification.title }}</p>
              <p class="notification-message">{{ notification.message }}</p>
              @if (notification.type === 'registration') {
                <p class="notification-details">
                  Partecipanti: {{ getRegistrationDetails(notification) }}
                </p>
              } @else if (notification.type === 'unregistration') {
                <p class="notification-details">
                  Partecipanti: {{ getUnregistrationDetails(notification) }}
                </p>
              } @else if (notification.type === 'report') {
                <p class="notification-details">
                  {{ getReportDetails(notification) }}
                </p>
                <p class="notification-description">
                  {{ getReportDescription(notification) }}
                </p>
              }
              <p class="notification-timestamp">
                {{ formatTimestamp(notification.timestamp) }}
              </p>
            </div>
            <div class="notification-actions">
              @if (!notification.read) {
                <button 
                  class="notification-mark-read"
                  (click)="onMarkAsRead($event, notification.id)"
                  aria-label="Segna come letta"
                >
                  ✓
                </button>
              }
              <button 
                class="notification-close"
                (click)="onClose($event, notification.id)"
                aria-label="Chiudi notifica"
              >
                ✕
              </button>
            </div>
          </div>
          <div class="notification-progress" *ngIf="!notification.read"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 450px;
      pointer-events: auto;
    }

    @media (max-width: 768px) {
      .notifications-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }

    .notification-toast {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 4px solid;
      animation: slideIn 0.3s ease-out forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    .notification-toast:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      transform: translateX(-4px);
    }

    .notification-success {
      border-left-color: #10b981;
      background: #f0fdf4;
    }

    .notification-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .notification-danger {
      border-left-color: #ef4444;
      background: #fef2f2;
    }

    .notification-info {
      border-left-color: #3b82f6;
      background: #f0f9ff;
    }

    .notification-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      position: relative;
    }

    .notification-icon {
      font-size: 24px;
      flex-shrink: 0;
      line-height: 1.5;
    }

    .notification-text {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      margin: 0 0 4px 0;
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
    }

    .notification-message {
      margin: 0;
      font-size: 13px;
      color: #4b5563;
      word-wrap: break-word;
    }

    .notification-details {
      margin: 6px 0 0 0;
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }

    .notification-description {
      margin: 6px 0 0 0;
      font-size: 12px;
      color: #6b7280;
      max-height: 50px;
      overflow-y: auto;
    }

    .notification-close {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #9ca3af;
      font-size: 18px;
      line-height: 1;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .notification-close:hover {
      color: #ef4444;
    }

    .notification-progress {
      height: 3px;
      background: linear-gradient(90deg, currentColor 0%, currentColor 100%);
      animation: progress 8s linear forwards;
    }

    .notification-danger .notification-progress,
    .notification-report .notification-progress {
      animation-duration: 15s;
    }

    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    .toast-success {
      --progress-color: #10b981;
    }

    .toast-warning {
      --progress-color: #f59e0b;
    }

    .toast-danger {
      --progress-color: #ef4444;
    }

    .notification-read {
      opacity: 0.7;
      border-left-color: #9ca3af;
    }

    .notification-unread-indicator {
      position: absolute;
      top: 8px;
      left: 8px;
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
    }

    .notification-mark-read {
      background: #10b981;
      color: white;
      border: none;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .notification-mark-read:hover {
      background: #059669;
    }

    .notification-timestamp {
      margin: 6px 0 0 0;
      font-size: 11px;
      color: #9ca3af;
      font-style: italic;
    }
  `],
})
export class NotificationsContainerComponent implements OnInit {
  notifications: Notification[] = [];
  private dismissedNotifications = new Set<string>(); // Track dismissed toast notifications

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(
      (notifications: Notification[]) => {
        // Filter out dismissed notifications and read notifications from toast view
        this.notifications = notifications.filter(n => 
          !this.dismissedNotifications.has(n.id) && !n.read
        );
      }
    );
  }

  async onNotificationClick(notification: Notification): Promise<void> {
    await this.notificationService.markAsRead(notification.id);
  }

  onClose(event: Event, id: string): void {
    event.stopPropagation();
    // Just dismiss from toast view, don't remove from global notifications
    this.dismissedNotifications.add(id);
    // Update local notifications list to hide the dismissed one
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  getRegistrationDetails(notification: Notification): string {
    const data = notification.data as any;
    const capacity = data.capacity ? ` / ${data.capacity}` : ' / illimitati';
    return `${data.currentParticipants}${capacity} partecipanti`;
  }

  getUnregistrationDetails(notification: Notification): string {
    const data = notification.data as any;
    return `${data.currentParticipants} partecipanti rimasti`;
  }

  getReportDetails(notification: Notification): string {
    const data = notification.data as any;
    if (data.reportedEvent) {
      return `Evento: ${data.reportedEvent.title}`;
    } else if (data.reportedUser) {
      return `Utente: @${data.reportedUser.username}`;
    }
    return '';
  }

  async onMarkAsRead(event: Event, notificationId: string): Promise<void> {
    event.stopPropagation();
    await this.notificationService.markAsRead(notificationId);
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ora';
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    if (days < 7) return `${days}g fa`;
    
    return timestamp.toLocaleDateString();
  }

  getReportDescription(notification: Notification): string {
    const data = notification.data as any;
    return data.description || '';
  }
}
