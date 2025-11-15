import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketService, RegistrationNotification, UnregistrationNotification, ReportNotification } from './socket';
import { ApiService } from './api';

export interface Notification {
  id: string;
  type: 'registration' | 'unregistration' | 'report';
  title: string;
  message: string;
  color: 'success' | 'danger' | 'warning' | 'info';
  data: RegistrationNotification | UnregistrationNotification | ReportNotification;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();

  constructor(private socketService: SocketService, private api: ApiService) {
    this.initializeListeners();
    this.loadStoredNotifications();
  }

  private initializeListeners(): void {
    // Listen to registration notifications
    this.socketService.registration$.subscribe((data: RegistrationNotification) => {
      this.addNotification({
        type: 'registration',
        title: `New registration`,
        message: `${data.user.username} registered to "${data.eventTitle}"`,
        color: 'success',
        data,
      });
    });

    // Listen to unregistration notifications
    this.socketService.unregistration$.subscribe((data: UnregistrationNotification) => {
      this.addNotification({
        type: 'unregistration',
        title: `Registration cancelled`,
        message: `${data.user.username} cancelled registration from "${data.eventTitle}"`,
        color: 'warning',
        data,
      });
    });

    // Listen to report notifications
    this.socketService.report$.subscribe((data: ReportNotification) => {
      const target = data.reportedEvent
        ? `event "${data.reportedEvent.title}"`
        : `user @${data.reportedUser?.username}`;

      this.addNotification({
        type: 'report',
        title: `New report`,
        message: `Report for ${target}`,
        color: 'danger',
        data,
      });
    });
  }

  private addNotification(config: Omit<Notification, 'id' | 'timestamp'>): void {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      ...config,
      timestamp: new Date(),
    };

    console.log('Notification received:', config.type, config.title);

    const current = this.notifications.value;
    this.notifications.next([...current, notification]);
  }

  private async loadStoredNotifications(): Promise<void> {
    try {
      const response = await this.api.get<{ success: boolean; notifications: any[] }>('/notifications?unreadOnly=false&limit=100').toPromise();
      if (response?.success && response.notifications) {
        const storedNotifications: Notification[] = response.notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          color: n.color,
          data: n.data,
          timestamp: new Date(n.timestamp),
        }));

        this.notifications.next(storedNotifications);
        console.log(`Loaded ${storedNotifications.length} notifications`);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Public method to refresh notifications
  async refresh(): Promise<void> {
    await this.loadStoredNotifications();
  }

  removeNotification(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.api.get<{ success: boolean; count: number }>('/notifications/count?unreadOnly=true').toPromise();
      return response?.success ? response.count : 0;
    } catch (error) {
      console.error('Errore nel conteggio notifiche non lette:', error);
      return 0;
    }
  }

  clearAll(): void {
    this.notifications.next([]);
  }
}
