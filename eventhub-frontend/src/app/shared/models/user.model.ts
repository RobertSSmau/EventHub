export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
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
  token: string;
  user: User;
}
