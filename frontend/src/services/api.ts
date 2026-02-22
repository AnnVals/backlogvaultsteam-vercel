import axios from 'axios';
import type { ApiResponse, Game, LibraryEntry, UserStats, SteamPreview } from '@/types';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bv_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('bv_token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export const authApi = {
  register: (d: { username: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/auth/register', d).then(r => r.data),
  login: (d: { username: string; password: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/auth/login', d).then(r => r.data),
  me: () => api.get<ApiResponse<any>>('/auth/me').then(r => r.data),
};

export const gamesApi = {
  search: (q: string, page = 1) =>
    api.get<ApiResponse<Game[]>>('/games/search?q=' + encodeURIComponent(q) + '&page=' + page).then(r => r.data),
  popular: (page = 1) =>
    api.get<ApiResponse<Game[]>>('/games/popular?page=' + page).then(r => r.data),
  getOne: (id: number) =>
    api.get<ApiResponse<Game>>('/games/' + id).then(r => r.data),
};

export const libraryApi = {
  getAll: (params?: { platform?: string; status?: string; page?: number }) =>
    api.get<ApiResponse<LibraryEntry[]>>('/library', { params }).then(r => r.data),
  add: (payload: any) =>
    api.post<ApiResponse<LibraryEntry>>('/library', payload).then(r => r.data),
  update: (id: string, payload: any) =>
    api.put<ApiResponse<LibraryEntry>>('/library/' + id, payload).then(r => r.data),
  clearAll: () =>
    api.delete<ApiResponse>('/library').then(r => r.data),
  remove: (id: string) =>
    api.delete<ApiResponse>('/library/' + id).then(r => r.data),
};

export const importApi = {
  steamPreview: (steamId: string) =>
    api.get('/import/steam/preview/' + steamId).then(r => r.data),
  importSteam: (data: { steam_id: string; selected_appids?: number[] }) =>
    api.post('/import/steam', data).then(r => r.data),
};

export const statsApi = {
  get: () => api.get<ApiResponse<UserStats>>('/stats').then(r => r.data),
};

export default api;