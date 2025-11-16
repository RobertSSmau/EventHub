import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { AuthService } from '../../../core/services/auth';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import {
  CreateEventRequest,
  Event,
  EventListResponse,
  EventParticipant,
} from '../../../shared/models/event.model';
import { Registration } from '../../../shared/models/registration.model';
import { User } from '../../../shared/models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-dashboard.html'
})
export class UserDashboard implements OnInit, OnDestroy {
  myEvents: Event[] = [];
  myRegistrations: Registration[] = [];
  participants: Record<number, EventParticipant[]> = {};
  participantLoading = new Set<number>();
  myEventsLoading = false;
  registrationsLoading = false;
  myEventsError = '';
  registrationsError = '';
  createEventData: CreateEventRequest & { dateLocal?: string } = {
    title: '',
    description: '',
    category: '',
    location: '',
    date: '',
    capacity: undefined,
    image_url: '',
  };
  createError = '';
  createSuccess = '';
  createLoading = false;

  // Eventi disponibili con ricerca e filtri
  availableEvents: Event[] = [];
  availableEventsLoading = false;
  availableEventsError = '';
  availableEventsPagination = {
    total: 0,
    limit: 10,
    offset: 0,
  };
  searchQuery = '';
  searchType: 'title' | 'category' | 'location' | 'dateRange' = 'title';
  dateFrom = '';
  dateTo = '';
  selectedCategory = '';
  selectedStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | '' = 'APPROVED';
  categories: string[] = ['Tech', 'Business', 'Art', 'Sports', 'Education', 'Other'];

  activeSection: 'create' | 'my-events' | 'registrations' | 'browse' | 'notifications' = 'my-events';

  currentUser: User | null = null;

  notifications: Notification[] = [];

  isMobileMenuOpen = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private subs: Subscription[] = [];

  constructor(
    private eventService: EventService,
    private registrationService: RegistrationService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyEvents();
    this.loadRegistrations();
    this.loadAvailableEvents();

    // Subscribe to notifications
    this.subs.push(
      this.notificationService.notifications$.subscribe(
        (notifications: Notification[]) => {
          this.notifications = notifications;
        }
      )
    );

    // Configure search debounce
    this.subs.push(
      this.searchSubject
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(searchTerm => {
          this.performSearch(searchTerm);
        })
    );

    // Subscribe to current user
    this.subs.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  loadMyEvents(): void {
    this.myEventsLoading = true;
    this.myEventsError = '';
    this.eventService.getMyEvents().subscribe({
      next: (events) => {
        this.myEvents = events;
      },
      error: (err) => {
        this.myEventsError = err.error?.message || 'Unable to load your events';
      },
      complete: () => {
        this.myEventsLoading = false;
      }
    });
  }

  loadRegistrations(): void {
    this.registrationsLoading = true;
    this.registrationsError = '';
    this.registrationService.getMyRegistrations().subscribe({
      next: (registrations) => {
        this.myRegistrations = registrations;
      },
      error: (err) => {
        this.registrationsError = err.error?.message || 'Unable to load registrations';
      },
      complete: () => {
        this.registrationsLoading = false;
      }
    });
  }

  loadAvailableEvents(): void {
    this.availableEventsLoading = true;
    this.availableEventsError = '';
    
    const filters: any = {};
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.selectedCategory) filters.category = this.selectedCategory;
    
    // Aggiungi filtri di ricerca basati sul tipo selezionato
    if (this.searchQuery.trim()) {
      switch (this.searchType) {
        case 'title':
          filters.title = this.searchQuery.trim();
          break;
        case 'category':
          filters.category = this.searchQuery.trim();
          break;
        case 'location':
          filters.location = this.searchQuery.trim();
          break;
      }
    }
    
    // Filtro per intervallo di date
    if (this.dateFrom) filters.dateFrom = this.dateFrom;
    if (this.dateTo) filters.dateTo = this.dateTo;
    
    // Paginazione
    filters.limit = this.availableEventsPagination.limit;
    filters.offset = this.availableEventsPagination.offset;
    
    this.eventService.getEvents(filters).subscribe({
      next: (response: EventListResponse) => {
        this.availableEvents = response.events;
        this.availableEventsPagination = response.pagination;
      },
      error: (err) => {
        this.availableEventsError = err.error?.message || 'Unable to load events';
      },
      complete: () => {
        this.availableEventsLoading = false;
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(searchTerm: string): void {
    this.loadAvailableEvents();
  }

  onFilterChange(): void {
    this.loadAvailableEvents();
  }

  onSearchTypeChange(): void {
    // Resetta la query di ricerca quando si cambia tipo
    this.searchQuery = '';
    this.loadAvailableEvents();
  }

  onDateRangeChange(): void {
    this.loadAvailableEvents();
  }

  registerForEvent(event: Event): void {
    this.registrationService.register(event.id).subscribe({
      next: () => {
        // Ricarica le registrazioni e gli eventi disponibili
        this.loadRegistrations();
        this.loadAvailableEvents();
      },
      error: (err: any) => {
        this.availableEventsError = err.error?.message || 'Unable to register for event';
      }
    });
  }

  isRegisteredForEvent(eventId: number): boolean {
    return this.myRegistrations.some(reg => reg.event_id === eventId);
  }

  submitEvent(): void {
    console.log('🔴 submitEvent() called');
    console.log('📋 createEventData:', this.createEventData);
    
    if (!this.createEventData.dateLocal) {
      this.createError = 'Select event date and time';
      console.log('❌ No dateLocal');
      return;
    }

    this.createLoading = true;
    this.createError = '';
    this.createSuccess = '';

    const payload: CreateEventRequest = {
      title: this.createEventData.title,
      description: this.createEventData.description,
      category: this.createEventData.category,
      location: this.createEventData.location,
      date: new Date(this.createEventData.dateLocal).toISOString(),
      capacity: this.createEventData.capacity,
      image_url: this.createEventData.image_url,
    };

    console.log('📤 Payload being sent:', payload);

    this.eventService.createEvent(payload).subscribe({
      next: (res) => {
        console.log('✅ Response from server:', res);
        this.createSuccess = res.message;
        this.resetCreateForm();
        this.loadMyEvents();
      },
      error: (err) => {
        console.error('❌ Error from server:', err);
        this.createError = err.error?.message || 'Unable to create event';
      },
      complete: () => {
        this.createLoading = false;
      }
    });
  }

  deleteEvent(event: Event): void {
    this.eventService.deleteEvent(event.id).subscribe({
      next: () => {
        this.myEvents = this.myEvents.filter((e) => e.id !== event.id);
      },
      error: () => {
        this.myEventsError = 'Unable to delete event';
      }
    });
  }

  toggleParticipants(eventId: number): void {
    if (this.participants[eventId]) {
      delete this.participants[eventId];
      return;
    }

    this.participantLoading.add(eventId);
    this.eventService.getParticipants(eventId).subscribe({
      next: (data) => {
        this.participants[eventId] = data;
      },
      error: () => {
        this.myEventsError = 'Unable to load participants';
      },
      complete: () => {
        this.participantLoading.delete(eventId);
      }
    });
  }

  private resetCreateForm(): void {
    this.createEventData = {
      title: '',
      description: '',
      category: '',
      location: '',
      date: '',
      capacity: undefined,
      image_url: '',
      dateLocal: '',
    };
  }

  openChat(eventId: number): void {
    this.router.navigate(['/chat'], { queryParams: { eventId } });
  }

  setActiveSection(section: 'create' | 'my-events' | 'registrations' | 'browse' | 'notifications'): void {
    this.activeSection = section;
    // Chiudi il menu mobile quando si seleziona una sezione
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  get availableEventsCurrentPage(): number {
    return Math.floor(this.availableEventsPagination.offset / this.availableEventsPagination.limit) + 1;
  }

  get availableEventsTotalPages(): number {
    return Math.ceil(this.availableEventsPagination.total / this.availableEventsPagination.limit);
  }

  goToAvailableEventsPage(page: number): void {
    if (page < 1 || page > this.availableEventsTotalPages) return;
    this.availableEventsPagination.offset = (page - 1) * this.availableEventsPagination.limit;
    this.loadAvailableEvents();
  }

  nextAvailableEventsPage(): void {
    if (this.availableEventsCurrentPage < this.availableEventsTotalPages) {
      this.goToAvailableEventsPage(this.availableEventsCurrentPage + 1);
    }
  }

  previousAvailableEventsPage(): void {
    if (this.availableEventsCurrentPage > 1) {
      this.goToAvailableEventsPage(this.availableEventsCurrentPage - 1);
    }
  }

  changeAvailableEventsPageSize(newLimit: number): void {
    this.availableEventsPagination.limit = newLimit;
    this.availableEventsPagination.offset = 0;
    this.loadAvailableEvents();
  }

  // Notification methods
  loadNotifications(): void {
    this.notificationService.refresh();
  }

  removeNotification(notificationId: string): void {
    this.notificationService.removeNotification(notificationId);
  }

  getRegistrationDetails(notification: Notification): string {
    const data = notification.data as any;
    const capacity = data.capacity ? ` / ${data.capacity}` : ' / unlimited';
    return `${data.currentParticipants}${capacity}`;
  }

  getUnregistrationDetails(notification: Notification): string {
    const data = notification.data as any;
    return `${data.currentParticipants} participants remaining`;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.forEach(sub => sub.unsubscribe());
  }
}
