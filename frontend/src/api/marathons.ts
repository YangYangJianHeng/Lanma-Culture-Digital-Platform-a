import request from './request';

export interface MarathonItem {
  id: number;
  year: number;
  name: string;
  date: string | null;
  location: string | null;
  slogan: string | null;
  description: string | null;
  images: string | null;
  participant_count: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const marathonApi = {
  list: () =>
    request.get<{ code: number; data: MarathonItem[] }>('/marathons'),

  detail: (id: number) =>
    request.get<{ code: number; data: MarathonItem }>(`/marathons/${id}`),

  adminList: () =>
    request.get<{ code: number; data: MarathonItem[] }>('/admin/marathons'),

  create: (data: Partial<MarathonItem>) =>
    request.post<{ code: number; data: MarathonItem }>('/admin/marathons', data),

  update: (id: number, data: Partial<MarathonItem>) =>
    request.put<{ code: number; data: MarathonItem }>(`/admin/marathons/${id}`, data),

  delete: (id: number) =>
    request.delete<{ code: number; data: null }>(`/admin/marathons/${id}`)
};
