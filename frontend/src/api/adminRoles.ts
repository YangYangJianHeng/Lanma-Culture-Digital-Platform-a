import request from './request';

export interface RoleDefinition {
  id: number;
  role_name: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export const adminRoleApi = {
  list: () =>
    request.get<{ code: number; data: RoleDefinition[] }>('/admin/roles'),

  create: (data: { role_name: string; display_name: string; description?: string; sort_order?: number }) =>
    request.post<{ code: number; data: RoleDefinition }>('/admin/roles', data),

  update: (id: number, data: { role_name: string; display_name: string; description?: string; sort_order?: number }) =>
    request.put<{ code: number; data: RoleDefinition }>(`/admin/roles/${id}`, data),

  delete: (id: number) =>
    request.delete<{ code: number; data: null }>(`/admin/roles/${id}`)
};
