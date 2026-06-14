import request from './request';

export interface FoodRecord {
  id: number;
  name: string;
  category: string;
  description: string;
  image_url: string;
  address: string;
  rating: string | null;
  recommend: string;
  ai_analysis: string | null;
  sort_order: number;
  created_at: string;
}

export const foodApi = {
  list: (category?: string) =>
    request.get<{ code: number; data: FoodRecord[] }>('/foods', {
      params: category ? { category } : {}
    }),
  detail: (id: number) =>
    request.get<{ code: number; data: FoodRecord }>(`/foods/${id}`),
};
