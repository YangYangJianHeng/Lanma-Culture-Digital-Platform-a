// 通用分页响应
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

// 通用 API 响应
export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}
