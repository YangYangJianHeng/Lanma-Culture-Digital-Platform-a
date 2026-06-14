import request from './request';
import type { FoodRecord } from './foods';
import type { TourismRecord } from './tourism';

export interface RecommendResult {
  foods: FoodRecord[];
  tourism: TourismRecord[];
  based_on: {
    occupation: string;
    age: string;
  };
}

export const recommendApi = {
  get: (params?: { occupation?: string; age?: number; gender?: string }) =>
    request.get<{ code: number; data: RecommendResult }>('/recommend', { params }),
};
