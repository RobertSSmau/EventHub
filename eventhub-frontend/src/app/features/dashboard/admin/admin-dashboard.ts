import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { EventService } from '../../../core/services/event.service';
import { ReportService } from '../../../core/services/report.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth';
import { Event, EventListResponse } from '../../../shared/models/event.model';
import {
  Report,
  ReportStatus,
  ReportListResponse,
} from '../../../shared/models/report.model';
import { User, UserListResponse } from '../../../shared/models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard implements OnInit, OnDestroy {
  pendingEvents: Event[] = [];
  eventsLoading = false;
  eventsError = '';
  eventsPagination = {
    total: 0,
    limit: 10,
    offset: 0,
  };

  reports: Report[] = [];
  reportsLoading = false;
  reportsError = '';

  users: User[] = [];
  usersLoading = false;
  usersError = '';
  usersPagination = {
    total: 0,
    limit: 10,
    offset: 0,
  };

  reportStatusOptions: ReportStatus[] = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
  reportDraftStatus: Record<number, ReportStatus> = {};

  activeSection: 'pending-events' | 'reports' | 'users' = 'pending-events';

  isMobileMenuOpen = false;

  userSearchTerm = '';
  private debouncedSearchTerm = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private subs: Subscription[] = [];

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
    // loadUsers is called in setActiveSection when users tab is selected

    // Configure search debounce
    this.subs.push(
      this.searchSubject
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(searchTerm => {
          this.debouncedSearchTerm = searchTerm;
        })
    );
  }

  get filteredUsers() {
    const searchTerm = this.debouncedSearchTerm.toLowerCase().trim();
    return this.users.filter(user =>
      !searchTerm ||
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
  }

  loadPendingEvents(): void {
    this.eventsLoading = true;
    this.eventsError = '';
    this.eventService.getEvents({ 
      status: 'PENDING', 
      limit: this.eventsPagination.limit,
      offset: this.eventsPagination.offset
    }).subscribe({
      next: (response: EventListResponse) => {
        this.pendingEvents = response.events;
        this.eventsPagination = response.pagination;
      },
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
    this.userService.getAllUsers({
      limit: this.usersPagination.limit,
      offset: this.usersPagination.offset
    }).subscribe({
      next: (response: UserListResponse) => {
        this.users = response.users;
        this.usersPagination = response.pagination;
        // Reset search when loading new page
        this.userSearchTerm = '';
        this.debouncedSearchTerm = '';
      },
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

  setActiveSection(section: 'pending-events' | 'reports' | 'users'): void {
    this.activeSection = section;
    // Reset pagination when switching sections
    if (section === 'pending-events') {
      this.eventsPagination.offset = 0;
      this.loadPendingEvents();
    } else if (section === 'users') {
      this.usersPagination.offset = 0;
      this.loadUsers();
    }
    // Chiudi il menu mobile quando si seleziona una sezione
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.forEach(sub => sub.unsubscribe());
  }

  onUserSearch(): void {
    this.searchSubject.next(this.userSearchTerm);
  }

  get currentPage(): number {
    return Math.floor(this.usersPagination.offset / this.usersPagination.limit) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.usersPagination.total / this.usersPagination.limit);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.usersPagination.offset = (page - 1) * this.usersPagination.limit;
    this.loadUsers();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  changePageSize(newLimit: number): void {
    this.usersPagination.limit = newLimit;
    this.usersPagination.offset = 0;
    this.loadUsers();
  }

  get eventsCurrentPage(): number {
    return Math.floor(this.eventsPagination.offset / this.eventsPagination.limit) + 1;
  }

  get eventsTotalPages(): number {
    return Math.ceil(this.eventsPagination.total / this.eventsPagination.limit);
  }

  goToEventsPage(page: number): void {
    if (page < 1 || page > this.eventsTotalPages) return;
    this.eventsPagination.offset = (page - 1) * this.eventsPagination.limit;
    this.loadPendingEvents();
  }

  nextEventsPage(): void {
    if (this.eventsCurrentPage < this.eventsTotalPages) {
      this.goToEventsPage(this.eventsCurrentPage + 1);
    }
  }

  previousEventsPage(): void {
    if (this.eventsCurrentPage > 1) {
      this.goToEventsPage(this.eventsCurrentPage - 1);
    }
  }

  changeEventsPageSize(newLimit: number): void {
    this.eventsPagination.limit = newLimit;
    this.eventsPagination.offset = 0;
    this.loadPendingEvents();
  }
}
