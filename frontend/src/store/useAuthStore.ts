import { create } from 'zustand';
import { authApi, UserInfo } from '../api/auth';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
  init: () => Promise<void>;
  updateUser: (userData: Partial<UserInfo>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  initialized: false,

  setAuth: (token: string, user: UserInfo) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ initialized: true });
      return;
    }

    set({ loading: true });
    try {
      const res = await authApi.getMe();
      set({ user: res.data, initialized: true, loading: false });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, initialized: true, loading: false });
    }
  },

  updateUser: (userData) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  }
}));
