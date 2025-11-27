import type { AuthError, User, Session } from "@supabase/supabase-js";

export interface SignUpParams {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
  }
  
  export interface SignInParams {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }