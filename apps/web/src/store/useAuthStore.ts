import { create } from 'zustand';
import { AuthUser, LoginInput, SignupInput } from '@sangam/shared';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  login: (input: LoginInput) => Promise<{ requires2FA?: boolean; userId?: string }>;
  signup: (input: SignupInput) => Promise<void>;
  guestLogin: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('sangam_token'),
  isLoading: true,
  error: null,

  setAuth: (user, token) => {
    localStorage.setItem('sangam_token', token);
    set({ user, token, error: null });
  },

  login: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');

      if (data.requires2FA) {
        set({ isLoading: false });
        return { requires2FA: true, userId: data.userId };
      }

      localStorage.setItem('sangam_token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isLoading: false });
      return {};
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signup: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');

      localStorage.setItem('sangam_token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  guestLogin: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join as guest');

      localStorage.setItem('sangam_token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('sangam_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('sangam_token');
    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, token, isLoading: false });
      } else {
        localStorage.removeItem('sangam_token');
        set({ user: null, token: null, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
