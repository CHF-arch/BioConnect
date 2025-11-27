import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from './store/useAuthStore';
import Cookies from 'js-cookie'; // You'll need to install this: npm install js-cookie

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing from .env file");
}

// Custom storage adapter using Cookies
const cookieStorage = {
  getItem: (key: string) => {
    return Cookies.get(key) || null;
  },
  setItem: (key: string, value: string) => {
    // Set cookie to expire in 1 day, secure only in prod, sameSite strict
    Cookies.set(key, value, { 
      expires: 1, 
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax' 
    });
  },
  removeItem: (key: string) => {
    Cookies.remove(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage, // Use cookies instead of localStorage
  },
});

// Sync Supabase session with Zustand store
supabase.auth.onAuthStateChange((_event, session) => {
  const { setSession, clearAuth } = useAuthStore.getState();
  
  if (session) {
    setSession(session);
  } else {
    clearAuth();
  }
});

// Initialize store with current session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    useAuthStore.getState().setSession(session);
  }
});