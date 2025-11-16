export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  email_verified?: boolean;
  is_blocked?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  user: User;
  message?: string;
}

export interface UserFilters {
  limit?: number;
  offset?: number;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
