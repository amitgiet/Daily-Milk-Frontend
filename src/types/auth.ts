export interface User {
  id: number;
  name: string;
  phone: string;
  dairyId: number;
  email?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  message?: string;
}

export interface RegisterResponse {
  accessToken: string;
  user: User;
  message?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  user: User;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
} 