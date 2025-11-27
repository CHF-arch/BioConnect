import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  session: Session | null;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setSession: (session: Session | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  session: null,
  
  setTokens: (accessToken, refreshToken) => 
    set({ accessToken, refreshToken }),
  
  setSession: (session) => 
    set({ 
      session,
      accessToken: session?.access_token || null,
      refreshToken: session?.refresh_token || null,
    }),
  
  clearAuth: () => 
    set({ 
      accessToken: null, 
      refreshToken: null, 
      session: null 
    }),
}));