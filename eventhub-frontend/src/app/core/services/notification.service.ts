import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketService, RegistrationNotification, UnregistrationNotification, ReportNotification } from './socket';
import { ApiService } from './api';

export interface Notification {
  id: string;
  type: 'registration' | 'unregistration' | 'report';
  title: string;
  message: string;
  icon: string;
  color: 'success' | 'danger' | 'warning' | 'info';
  data: RegistrationNotification | UnregistrationNotification | ReportNotification;
  timestamp: Date;
  read: boolean;
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
        title: `Nuova iscrizione`,
        message: `${data.user.username} si è iscritto a "${data.eventTitle}"`,
        icon: '✅',
        color: 'success',
        data,
      });
    });

    // Listen to unregistration notifications
    this.socketService.unregistration$.subscribe((data: UnregistrationNotification) => {
      this.addNotification({
        type: 'unregistration',
        title: `Cancellazione iscrizione`,
        message: `${data.user.username} si è cancellato da "${data.eventTitle}"`,
        icon: '❌',
        color: 'warning',
        data,
      });
    });

    // Listen to report notifications
    this.socketService.report$.subscribe((data: ReportNotification) => {
      const target = data.reportedEvent
        ? `evento "${data.reportedEvent.title}"`
        : `utente @${data.reportedUser?.username}`;

      this.addNotification({
        type: 'report',
        title: `Nuova segnalazione`,
        message: `Segnalazione per ${target} - Motivo: ${data.reason}`,
        icon: '⚠️',
        color: 'danger',
        data,
      });
    });
  }

  private addNotification(config: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      ...config,
      timestamp: new Date(),
      read: false,
    };

    // 🔔 LOG CONSOLE per debugging
    console.log('NOTIFICA RICEVUTA:', {
      tipo: config.type,
      titolo: config.title,
      messaggio: config.message,
      timestamp: new Date().toLocaleTimeString(),
      data: notification.data
    });

    const current = this.notifications.value;
    this.notifications.next([...current, notification]);

    // Note: Real-time notifications are now permanent like stored ones
    // They will remain until marked as read or page refresh
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
          icon: n.icon,
          color: n.color,
          data: n.data,
          timestamp: new Date(n.timestamp),
          read: n.read
        }));

        // Merge stored notifications with existing real-time notifications
        // Avoid duplicates by ID, prefer stored notifications for conflicts
        const currentNotifications = this.notifications.value;
        const mergedNotifications = [...currentNotifications];

        storedNotifications.forEach(stored => {
          const existingIndex = mergedNotifications.findIndex(n => n.id === stored.id);
          if (existingIndex >= 0) {
            // Replace existing with stored (stored has correct read status)
            mergedNotifications[existingIndex] = stored;
          } else {
            // Add new stored notification
            mergedNotifications.push(stored);
          }
        });

        this.notifications.next(mergedNotifications);
        console.log(`Caricate ${storedNotifications.length} notifiche storiche, totale: ${mergedNotifications.length}`);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle notifiche storiche:', error);
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      // Update local state immediately
      const current = this.notifications.value;
      const updated = current.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      this.notifications.next(updated);

      // Update on server
      await this.api.put(`/notifications/${id}/read`, {}).toPromise();
    } catch (error) {
      console.error('Errore nel marcare la notifica come letta:', error);
      // Revert local change on error
      const current = this.notifications.value;
      const reverted = current.map(n =>
        n.id === id ? { ...n, read: false } : n
      );
      this.notifications.next(reverted);
    }
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

  removeNotification(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }

  clearAll(): void {
    this.notifications.next([]);
  }
}
