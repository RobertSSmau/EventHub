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
  private isInitialized = false;

  constructor(private socketService: SocketService, private api: ApiService) {
    // Setup socket listeners immediately when service is created
    // This ensures we don't miss any real-time events
    this.initializeSocketListeners();
  }

  /**
   * Initialize notification system for current user
   * Loads notifications from MongoDB + listens to socket
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ NotificationService already initialized, reloading...');
      // Even if initialized, reload to get fresh data for current user
      await this.loadFromBackend();
      return;
    }

    console.log('📬 Initializing NotificationService for current user...');
    
    // Clear any previous state
    this.notifications.next([]);
    
    // Load notifications from MongoDB for current user
    await this.loadFromBackend();
    
    this.isInitialized = true;
  }

  /**
   * Reset notification system (call on logout)
   */
  reset(): void {
    console.log('🔄 Resetting NotificationService...');
    this.notifications.next([]);
    this.isInitialized = false;
  }

  private initializeSocketListeners(): void {
    // Listen to registration notifications
    this.socketService.registration$.subscribe((data: RegistrationNotification) => {
      console.log('📨 Real-time registration notification:', data);
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
      console.log('📨 Real-time unregistration notification:', data);
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
      console.log('📨 Real-time report notification:', data);
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

    const current = this.notifications.value;
    this.notifications.next([notification, ...current]);
  }

  /**
   * Load notifications from MongoDB for current logged user
   */
  private async loadFromBackend(): Promise<void> {
    try {
      console.log('📥 Loading notifications from MongoDB...');
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
        console.log(`✅ Loaded ${storedNotifications.length} notifications for current user`);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  }

  /**
   * Reload notifications from backend
   */
  async refresh(): Promise<void> {
    await this.loadFromBackend();
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
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }
}
