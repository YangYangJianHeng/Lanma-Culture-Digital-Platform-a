import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  occupation?: string;
  age?: number;
  gender?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: 'runner' | 'admin';
  occupation?: string;
  age?: number;
  gender?: string;
}

export interface AuthResult {
  token: string;
  user: UserInfo;
}

export const authApi = {
  login: (data: LoginParams) =>
    request.post<{ code: number; data: AuthResult }>('/auth/login', data),

  register: (data: RegisterParams) =>
    request.post<{ code: number; data: AuthResult }>('/auth/register', data),

  getMe: () =>
    request.get<{ code: number; data: UserInfo }>('/auth/me'),

  updateProfile: (data: { username?: string; avatar_url?: string; occupation?: string; age?: number; gender?: string }) =>
    request.put<{ code: number; data: UserInfo }>('/auth/profile', data),

  updatePassword: (data: { old_password: string; new_password: string }) =>
    request.put<{ code: number; message: string }>('/auth/password', data),

  logout: () =>
    request.post<{ code: number; message: string }>('/auth/logout')
};
