import { User } from './user.model';

export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  capacity?: number | null;
  image_url?: string | null;
  status: EventStatus;
  creator_id?: number;
  creator?: Pick<User, 'id' | 'username' | 'email'>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  capacity?: number;
  image_url?: string;
}

export type UpdateEventRequest = Partial<CreateEventRequest>;

export interface EventFilters {
  category?: string;
  location?: string;
  date?: string;
  status?: EventStatus;
  limit?: number;
  offset?: number;
}

export interface EventListResponse {
  events: Event[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface EventParticipant {
  id: number;
  username: string;
  email: string;
  registered_at?: string;
}
