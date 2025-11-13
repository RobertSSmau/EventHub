import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private api: ApiService) {}

  getAllUsers(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  blockUser(userId: number): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>(`/users/${userId}/block`, {});
  }

  unblockUser(userId: number): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>(`/users/${userId}/unblock`, {});
  }
}
