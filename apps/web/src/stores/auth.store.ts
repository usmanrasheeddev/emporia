import { create } from 'zustand';
import { api, ApiClientError } from '@/lib/api';
import type { User, ApiResponse } from '@/types';

const TOKEN_KEY = 'auth_token';

interface AuthCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const credentials: AuthCredentials = { email, password };
      const response = await api.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        credentials,
      );
      const { user, tokens } = response.data;
      const token = tokens.accessToken;

      localStorage.setItem(TOKEN_KEY, token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('An unexpected error occurred during login.');
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      await api.post<ApiResponse<any>>(
        '/auth/register',
        data,
      );
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('An unexpected error occurred during registration.');
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isAuthenticated: false, token: null, user: null });
      return;
    }

    set({ token, isLoading: true });

    api
      .get<ApiResponse<User>>('/auth/me')
      .then((response) => {
        set({
          user: response.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });
  },
}));
