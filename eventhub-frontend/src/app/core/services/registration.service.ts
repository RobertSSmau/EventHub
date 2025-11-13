import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { Registration } from '../../shared/models/registration.model';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  constructor(private api: ApiService) {}

  getMyRegistrations(): Observable<Registration[]> {
    return this.api.get<Registration[]>('/registrations/mine');
  }

  register(eventId: number): Observable<{ message: string; registration: Registration }> {
    return this.api.post<{ message: string; registration: Registration }>(
      `/registrations/${eventId}`,
      {}
    );
  }

  unregister(eventId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/registrations/${eventId}`);
  }
}
