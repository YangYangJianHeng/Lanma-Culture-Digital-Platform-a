import request from './request';

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post<{ code: number; data: { url: string } }>('/upload', formData, {
      timeout: 120000
    });
  }
};
