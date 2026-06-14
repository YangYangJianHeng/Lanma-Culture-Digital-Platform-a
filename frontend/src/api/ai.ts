import request from './request';

export interface AiMessage {
  id: number;
  userId: number;
  role: string;
  content: string;
  source: string;
  created_at: string;
}

export const aiApi = {
  chat: (message: string, model?: string) =>
    request.post<{ code: number; data: { reply: string; source: string } }>('/ai/chat', {
      message,
      model: model || 'llama3',
    }),

  history: () =>
    request.get<{ code: number; data: AiMessage[] }>('/ai/history'),
};
