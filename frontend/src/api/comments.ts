import request from './request';

export interface CommentRecord {
  id: number;
  content: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export const commentApi = {
  list: (targetType: string, targetId: number) =>
    request.get<{ code: number; data: CommentRecord[] }>(`/comments/${targetType}/${targetId}`),

  create: (data: { target_type: string; target_id: number; content: string }) =>
    request.post<{ code: number; data: CommentRecord }>('/comments', data),
};

export function maskUsername(name: string): string {
  if (!name) return '匿*';
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}
