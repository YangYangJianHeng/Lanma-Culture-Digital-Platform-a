import request from './request';

export interface MedalItem {
  id: number;
  name: string;
  year: number;
  model_url: string;
  thumbnail_url: string;
  description: string | null;
  sort_order: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
}

export const medalApi = {
  list: (params?: { sort?: string; featured?: string }) =>
    request.get<{ code: number; data: MedalItem[] }>('/medals', { params }),

  detail: (id: number) =>
    request.get<{ code: number; data: MedalItem }>(`/medals/${id}`)
};
