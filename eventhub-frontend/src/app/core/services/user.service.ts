import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { User, UserFilters, UserListResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private api: ApiService) {}

  getAllUsers(filters?: UserFilters): Observable<UserListResponse> {
    return this.api.get<UserListResponse>('/users', filters);
  }

  blockUser(userId: number): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>(`/users/${userId}/block`, {});
  }

  unblockUser(userId: number): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>(`/users/${userId}/unblock`, {});
  }
}
