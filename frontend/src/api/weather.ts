import request from './request';

export interface WeatherRecord {
  id: number;
  location: string;
  record_time: string;
  temperature: string | null;
  feels_like: string | null;
  temp_min: string | null;
  temp_max: string | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: string | null;
  wind_direction: string | null;
  weather_condition: string | null;
  weather_code: number | null;
  precipitation: string | null;
  visibility: string | null;
  uv_index: number | null;
  air_quality: number | null;
  forecast_type: string;
  source: string;
  ai_analysis: string | null;
  created_at: string;
}

export const weatherApi = {
  latest: (location?: string) =>
    request.get<{ code: number; data: WeatherRecord | null }>('/weather/latest', {
      params: { location: location || '兰州' }
    }),

  history: (params?: { location?: string; days?: number }) =>
    request.get<{ code: number; data: WeatherRecord[] }>('/weather/history', { params: { location: '兰州', days: 7, ...params } }),

  /** 从 OpenWeatherMap 实时获取当前天气 */
  now: (location?: string) =>
    request.get<{ code: number; data: WeatherRecord | null }>('/weather/now', {
      params: { location: location || '兰州' }
    }),

  /** 从 OpenWeatherMap 获取 5 天预报 */
  forecast: (location?: string) =>
    request.get<{ code: number; data: WeatherRecord[] }>('/weather/forecast', {
      params: { location: location || '兰州' }
    }),
};
