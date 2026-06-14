import request from './request';

export interface PublicationRecord {
  id: number;
  title: string;
  summary: string;
  cover_image: string;
  content: string;
  sort_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export const publicationApi = {
  list: () =>
    request.get<{ code: number; data: PublicationRecord[] }>('/publications'),
  detail: (id: number) =>
    request.get<{ code: number; data: PublicationRecord }>(`/publications/${id}`),
};
