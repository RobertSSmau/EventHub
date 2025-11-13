import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { AuthService } from '../../../core/services/auth';
import {
  CreateEventRequest,
  Event,
  EventParticipant,
} from '../../../shared/models/event.model';
import { Registration } from '../../../shared/models/registration.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.scss',
})
export class UserDashboard implements OnInit {
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
  searchQuery = '';
  selectedCategory = '';
  selectedStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | '' = '';
  categories: string[] = ['Tech', 'Business', 'Art', 'Sports', 'Education', 'Other'];

  constructor(
    private eventService: EventService,
    private registrationService: RegistrationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyEvents();
    this.loadRegistrations();
    this.loadAvailableEvents();
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
    if (this.searchQuery.trim()) filters.search = this.searchQuery.trim();
    if (this.selectedCategory) filters.category = this.selectedCategory;
    
    this.eventService.getEvents(filters).subscribe({
      next: (events) => {
        this.availableEvents = events;
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
    this.loadAvailableEvents();
  }

  onFilterChange(): void {
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
    if (!this.createEventData.dateLocal) {
      this.createError = 'Select event date and time';
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

    this.eventService.createEvent(payload).subscribe({
      next: (res) => {
        this.createSuccess = res.message;
        this.resetCreateForm();
        this.loadMyEvents();
      },
      error: (err) => {
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

  toggleParticipants(event: Event): void {
    if (this.participants[event.id]) {
      delete this.participants[event.id];
      return;
    }

    this.participantLoading.add(event.id);
    this.eventService.getParticipants(event.id).subscribe({
      next: (data) => {
        this.participants[event.id] = data;
      },
      error: () => {
        this.myEventsError = 'Unable to load participants';
      },
      complete: () => {
        this.participantLoading.delete(event.id);
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

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
