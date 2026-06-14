import request from './request';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: 'runner' | 'admin';
  occupation?: string;
  age?: number;
  gender?: string;
  created_at: string;
  updated_at: string;
}

export interface PageResult<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: T[];
}

export const adminUserApi = {
  list: (page = 1, limit = 20) =>
    request.get<{ code: number; data: PageResult<AdminUser> }>('/admin/users', { params: { page, limit } }),

  update: (id: number, data: Partial<AdminUser>) =>
    request.put<{ code: number; data: AdminUser }>(`/admin/users/${id}`, data),

  delete: (id: number) =>
    request.delete<{ code: number; data: null }>(`/admin/users/${id}`)
};
