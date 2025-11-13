import { Event } from './event.model';
import { User } from './user.model';

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: number;
  reporter_id?: number;
  reported_user_id?: number | null;
  reported_event_id?: number | null;
  reason: string;
  description?: string;
  status: ReportStatus;
  created_at?: string;
  admin_notes?: string | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
  reporter?: Pick<User, 'id' | 'username' | 'email'>;
  reportedUser?: Pick<User, 'id' | 'username' | 'email'>;
  reportedEvent?: Pick<Event, 'id' | 'title' | 'date' | 'location'>;
}

export interface CreateReportRequest {
  reported_user_id?: number;
  reported_event_id?: number;
  reason: string;
  description?: string;
}

export interface ReportFilters {
  status?: ReportStatus;
  type?: 'user' | 'event';
  limit?: number;
  offset?: number;
}

export interface ReportListResponse {
  reports: Report[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface UpdateReportStatusRequest {
  status: ReportStatus;
  admin_notes?: string;
}
