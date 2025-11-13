import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { AuthService } from '../../../core/services/auth';
import { Event } from '../../../shared/models/event.model';

@Component({
  selector: 'app-event-list',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss',
})
export class EventList implements OnInit, OnDestroy {
  events: Event[] = [];
  loading = false;
  error = '';
  registeringIds = new Set<number>();
  registeredEventIds = new Set<number>();
  successMessage = '';
  private authSub?: Subscription;

  constructor(
    private eventService: EventService,
    private registrationService: RegistrationService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.observeAuthChanges();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  private observeAuthChanges(): void {
    this.authSub = this.authService.currentUser$.subscribe(() => {
      if (this.authService.isAuthenticated) {
        this.loadRegistrations();
      } else {
        this.registeredEventIds.clear();
      }
    });
    if (this.authService.isAuthenticated) {
      this.loadRegistrations();
    }
  }

  private loadEvents(): void {
    this.loading = true;
    this.error = '';
    this.eventService.getEvents({ status: 'APPROVED', limit: 50 }).subscribe({
      next: (events) => {
        this.events = events;
      },
      error: (err) => {
        this.error = err.error?.message || 'Unable to load events';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private loadRegistrations(): void {
    this.registrationService.getMyRegistrations().subscribe({
      next: (registrations) => {
        this.registeredEventIds = new Set(registrations.map((reg) => reg.event_id));
      },
      error: () => {
        this.registeredEventIds.clear();
      }
    });
  }

  isRegistered(eventId: number): boolean {
    return this.registeredEventIds.has(eventId);
  }

  canRegister(event: Event): boolean {
    return event.status === 'APPROVED';
  }

  register(event: Event): void {
    if (!this.authService.isAuthenticated) {
      this.error = 'Login to register for events.';
      return;
    }
    if (this.isRegistered(event.id)) {
      this.unregister(event);
      return;
    }
    this.registeringIds.add(event.id);
    this.registrationService.register(event.id).subscribe({
      next: () => {
        this.registeredEventIds.add(event.id);
        this.successMessage = `You registered for ${event.title}`;
      },
      error: (err) => {
        this.error = err.error?.message || 'Unable to register';
      },
      complete: () => {
        this.registeringIds.delete(event.id);
      }
    });
  }

  unregister(event: Event): void {
    this.registeringIds.add(event.id);
    this.registrationService.unregister(event.id).subscribe({
      next: () => {
        this.registeredEventIds.delete(event.id);
        this.successMessage = `You left ${event.title}`;
      },
      error: (err) => {
        this.error = err.error?.message || 'Unable to unregister';
      },
      complete: () => {
        this.registeringIds.delete(event.id);
      }
    });
  }

  openChat(event: Event): void {
    if (!this.authService.isAuthenticated) {
      this.error = 'Login to join the event chat.';
      return;
    }
    this.router.navigate(['/chat'], { queryParams: { eventId: event.id } });
  }
}
