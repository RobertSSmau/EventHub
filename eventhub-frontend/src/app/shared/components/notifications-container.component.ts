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
        >
          <div class="notification-content">
            <div class="notification-text">
              <p class="notification-title">{{ notification.title }}</p>
              <p class="notification-message">{{ notification.message }}</p>
              <p class="notification-timestamp">
                {{ formatTimestamp(notification.timestamp) }}
              </p>
            </div>
            <button 
              class="notification-close"
              (click)="onClose($event, notification.id)"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
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

    .notification-toast:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
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
      justify-content: space-between;
      padding: 16px;
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

    .notification-timestamp {
      margin: 6px 0 0 0;
      font-size: 11px;
      color: #9ca3af;
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
  `],
})
export class NotificationsContainerComponent implements OnInit {
  notifications: Notification[] = [];
  private dismissedToastIds = new Set<string>(); // Track dismissed toasts locally

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(
      (notifications: Notification[]) => {
        // Filter out dismissed toasts, but keep them in the service for sidebar
        this.notifications = notifications.filter(n => !this.dismissedToastIds.has(n.id));
      }
    );
  }

  onClose(event: Event, id: string): void {
    event.stopPropagation();
    // Only dismiss from toast view locally, don't remove from global state
    this.dismissedToastIds.add(id);
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }
}
