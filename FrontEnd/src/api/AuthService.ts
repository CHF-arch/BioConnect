import { supabase } from '../supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { SignUpParams, SignInParams, AuthResponse } from '../types/AuthServiceTypes';
import { useAuthStore } from '../store/useAuthStore';

class AuthService {
  
  async signUp({ email, password, username, displayName }: SignUpParams): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || username,
            username: username,
          }
        }
      });

      if (error) {
        console.error('SignUp Error:', error);
        return {
          user: data?.user || null,
          session: data?.session || null,
          error: error,
        };
      }

      // Sync with Zustand store
      if (data.session) {
        useAuthStore.getState().setSession(data.session);
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error: any) {
      console.error('SignUp Exception:', error);
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  async signIn({ email, password }: SignInParams): Promise<AuthResponse> {
    try {
      if (!email || !password) {
        return {
          user: null,
          session: null,
          error: {
            name: 'ValidationError',
            message: 'Email and password are required',
            status: 400,
          } as AuthError,
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('SignIn Error Details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return {
          user: data?.user || null,
          session: data?.session || null,
          error: error,
        };
      }

      // Sync with Zustand store
      if (data.session) {
        useAuthStore.getState().setSession(data.session);
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error: any) {
      console.error('SignIn Exception:', error);
      return {
        user: null,
        session: null,
        error: {
          name: 'Exception',
          message: error.message || 'An unexpected error occurred',
          status: 500,
        } as AuthError,
      };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Clear Zustand store
      if (!error) {
        useAuthStore.getState().clearAuth();
      }
      
      return { error };
    } catch (error: any) {
      return { error: error as AuthError };
    }
  }

  async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        return { session: null, error };
      }

      // Update Zustand store
      if (data.session) {
        useAuthStore.getState().setSession(data.session);
      }

      return { session: data.session, error: null };
    } catch (error: any) {
      return { session: null, error: error as AuthError };
    }
  }

  // ... rest of the methods remain the same
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        useAuthStore.getState().setSession(session);
      }
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error: any) {
      return { error: error as AuthError };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error: any) {
      return { error: error as AuthError };
    }
  }

  async updateUserMetadata(metadata: Record<string, any>): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata,
      });
      return { error };
    } catch (error: any) {
      return { error: error as AuthError };
    }
  }

  async resendVerificationEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      return { error };
    } catch (error: any) {
      return { error: error as AuthError };
    }
  }
}

export const authService = new AuthService();
export default authService;