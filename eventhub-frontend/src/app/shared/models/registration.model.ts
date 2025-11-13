import { Event } from './event.model';

export interface Registration {
  user_id: number;
  event_id: number;
  registered_at: string;
  event?: Pick<Event, 'id' | 'title' | 'category' | 'location' | 'date' | 'description' | 'image_url'>;
}
