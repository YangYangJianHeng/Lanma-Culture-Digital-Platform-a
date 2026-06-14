import request from './request';

export interface LandmarkItem {
  id: number;
  name: string;
  longitude: string;
  latitude: string;
  category: string;
  cover_image: string;
  content: string | null;
  video_url: string | null;
  audio_url: string | null;
  distance_from_start: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const landmarkApi = {
  list: (params?: { category?: string }) =>
    request.get<{ code: number; data: LandmarkItem[] }>('/landmarks', { params }),

  detail: (id: number) =>
    request.get<{ code: number; data: LandmarkItem }>(`/landmarks/${id}`)
};
