import request from './request';

export interface TourismRecord {
  id: number;
  name: string;
  category: string;
  description: string;
  image_url: string;
  address: string;
  rating: string | null;
  latitude: string | null;
  longitude: string | null;
  ai_analysis: string | null;
  sort_order: number;
  created_at: string;
}

export const tourismApi = {
  list: (category?: string) =>
    request.get<{ code: number; data: TourismRecord[] }>('/tourism', {
      params: category ? { category } : {}
    }),
  detail: (id: number) =>
    request.get<{ code: number; data: TourismRecord }>(`/tourism/${id}`),
};
