import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import {
  CreateEventRequest,
  Event,
  EventFilters,
  EventListResponse,
  EventParticipant,
  EventStatus,
  UpdateEventRequest,
} from '../../shared/models/event.model';

interface EventMutationResponse {
  message: string;
  event: Event;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private api: ApiService) {}

  getEvents(filters?: EventFilters): Observable<EventListResponse> {
    return this.api.get<EventListResponse>('/events', filters);
  }

  getEventById(id: number): Observable<Event> {
    return this.api.get<Event>(`/events/${id}`);
  }

  getMyEvents(): Observable<Event[]> {
    return this.api.get<Event[]>('/events/mine');
  }

  createEvent(payload: CreateEventRequest): Observable<EventMutationResponse> {
    return this.api.post<EventMutationResponse>('/events', payload);
  }

  updateEvent(eventId: number, payload: UpdateEventRequest): Observable<EventMutationResponse> {
    return this.api.put<EventMutationResponse>(`/events/${eventId}`, payload);
  }

  deleteEvent(eventId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/events/${eventId}`);
  }

  approveEvent(eventId: number): Observable<EventMutationResponse> {
    return this.api.patch<EventMutationResponse>(`/events/${eventId}/approve`, {});
  }

  rejectEvent(eventId: number): Observable<EventMutationResponse> {
    return this.api.patch<EventMutationResponse>(`/events/${eventId}/reject`, {});
  }

  getParticipants(eventId: number): Observable<EventParticipant[]> {
    return this.api.get<EventParticipant[]>(`/events/${eventId}/participants`);
  }
}
