import request from './request';

export interface StoryItem {
  id: number;
  user_id: number;
  race_year: number;
  bib_number: string | null;
  finish_time: string | null;
  title: string;
  content: string;
  images: string[] | null;
  is_public: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: number;
    username: string;
    avatar_url: string | null;
  };
}

export interface PaginatedResult<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: T[];
}

export interface CreateStoryParams {
  race_year: number;
  bib_number?: string;
  finish_time?: string;
  title: string;
  content: string;
  images?: string[];
  is_public?: number;
}

export const storyApi = {
  list: (params?: { page?: number; limit?: number; year?: number; keyword?: string }) =>
    request.get<{ code: number; data: PaginatedResult<StoryItem> }>('/stories', { params }),

  detail: (id: number) =>
    request.get<{ code: number; data: StoryItem }>(`/stories/${id}`),

  create: (data: CreateStoryParams) =>
    request.post<{ code: number; data: StoryItem }>('/stories', data),

  update: (id: number, data: Partial<CreateStoryParams>) =>
    request.put<{ code: number; data: StoryItem }>(`/stories/${id}`, data),

  delete: (id: number) =>
    request.delete<{ code: number; message: string }>(`/stories/${id}`),

  myStories: (params?: { page?: number }) =>
    request.get<{ code: number; data: PaginatedResult<StoryItem> }>('/stories/my', { params }),

  toggleLike: (id: number) =>
    request.post<{ code: number; data: { liked: boolean; likes_count: number } }>(`/stories/${id}/like`),

  likeStatus: (id: number) =>
    request.get<{ code: number; data: { liked: boolean } }>(`/stories/${id}/like-status`)
};
