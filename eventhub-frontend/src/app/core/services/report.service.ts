import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import {
  CreateReportRequest,
  Report,
  ReportFilters,
  ReportListResponse,
  UpdateReportStatusRequest,
} from '../../shared/models/report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private api: ApiService) {}

  createReport(payload: CreateReportRequest): Observable<{ message: string; report: Report }> {
    return this.api.post<{ message: string; report: Report }>('/reports', payload);
  }

  getReports(filters?: ReportFilters): Observable<ReportListResponse> {
    return this.api.get<ReportListResponse>('/reports', filters);
  }

  getMyReports(): Observable<Report[]> {
    return this.api.get<Report[]>('/reports/my');
  }

  updateReportStatus(
    reportId: number,
    payload: UpdateReportStatusRequest
  ): Observable<{ message: string; report: Report }> {
    return this.api.patch<{ message: string; report: Report }>(`/reports/${reportId}`, payload);
  }

  deleteReport(reportId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/reports/${reportId}`);
  }
}
