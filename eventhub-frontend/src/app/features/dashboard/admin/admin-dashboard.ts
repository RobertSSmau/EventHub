import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { ReportService } from '../../../core/services/report.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth';
import { Event } from '../../../shared/models/event.model';
import {
  Report,
  ReportStatus,
  ReportListResponse,
} from '../../../shared/models/report.model';
import { User } from '../../../shared/models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
  pendingEvents: Event[] = [];
  eventsLoading = false;
  eventsError = '';

  reports: Report[] = [];
  reportsLoading = false;
  reportsError = '';

  users: User[] = [];
  usersLoading = false;
  usersError = '';

  reportStatusOptions: ReportStatus[] = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
  reportDraftStatus: Record<number, ReportStatus> = {};

  constructor(
    private eventService: EventService,
    private reportService: ReportService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingEvents();
    this.loadReports();
    this.loadUsers();
  }

  loadPendingEvents(): void {
    this.eventsLoading = true;
    this.eventsError = '';
    this.eventService.getEvents({ status: 'PENDING', limit: 50 }).subscribe({
      next: (events) => (this.pendingEvents = events),
      error: (err) => (this.eventsError = err.error?.message || 'Unable to load pending events'),
      complete: () => (this.eventsLoading = false),
    });
  }

  approve(event: Event): void {
    this.eventService.approveEvent(event.id).subscribe({
      next: () => this.removePending(event.id),
      error: () => (this.eventsError = 'Unable to approve event'),
    });
  }

  reject(event: Event): void {
    this.eventService.rejectEvent(event.id).subscribe({
      next: () => this.removePending(event.id),
      error: () => (this.eventsError = 'Unable to reject event'),
    });
  }

  private removePending(eventId: number): void {
    this.pendingEvents = this.pendingEvents.filter((event) => event.id !== eventId);
  }

  loadReports(): void {
    this.reportsLoading = true;
    this.reportsError = '';
    this.reportService.getReports({ limit: 50 }).subscribe({
      next: (response: ReportListResponse) => {
        this.reports = response.reports;
        this.reportDraftStatus = this.reports.reduce((acc, report) => {
          acc[report.id] = report.status;
          return acc;
        }, {} as Record<number, ReportStatus>);
      },
      error: (err) => (this.reportsError = err.error?.message || 'Unable to load reports'),
      complete: () => (this.reportsLoading = false),
    });
  }

  updateReportStatus(report: Report): void {
    const newStatus = this.reportDraftStatus[report.id];
    if (!newStatus || newStatus === report.status) return;

    this.reportService.updateReportStatus(report.id, { status: newStatus }).subscribe({
      next: () => {
        report.status = newStatus;
      },
      error: () => {
        this.reportsError = 'Unable to update report status';
        this.reportDraftStatus[report.id] = report.status;
      },
    });
  }

  deleteReport(report: Report): void {
    this.reportService.deleteReport(report.id).subscribe({
      next: () => {
        this.reports = this.reports.filter((r) => r.id !== report.id);
        delete this.reportDraftStatus[report.id];
      },
      error: () => (this.reportsError = 'Unable to delete report'),
    });
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.usersError = '';
    this.userService.getAllUsers().subscribe({
      next: (users) => (this.users = users),
      error: (err) => (this.usersError = err.error?.message || 'Unable to load users'),
      complete: () => (this.usersLoading = false),
    });
  }

  toggleUserBlock(user: User): void {
    const action = user.is_blocked ? this.userService.unblockUser(user.id) : this.userService.blockUser(user.id);
    action.subscribe({
      next: () => {
        user.is_blocked = !user.is_blocked;
      },
      error: () => (this.usersError = 'Unable to update user state'),
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
