import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';

const instance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000
});

// 请求拦截器：自动注入 token
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理 & 解包 AxiosResponse
instance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ code?: number; message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || '请求失败';

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({ code: status, message });
  }
);

// 响应拦截器已将 AxiosResponse 解包为 response.data，
// 因此实际返回的已经是响应体 { code, data } 而非 AxiosResponse<T>
interface UnwrappedAxios {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const request = instance as unknown as UnwrappedAxios;

export default request;
