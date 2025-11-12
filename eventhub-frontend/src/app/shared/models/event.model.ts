export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  capacity: number;
  currentRegistrations: number;
  organizerId: number;
  createdAt: string;
  updatedAt: string;
  organizer?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface CreateEventRequest {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  capacity: number;
}
