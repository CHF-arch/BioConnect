import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/useAuthStore';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private async refreshToken(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        // Refresh failed, clear auth
        useAuthStore.getState().clearAuth();
        return false;
      }
      
      // Update store with new session
      useAuthStore.getState().setSession(data.session);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      useAuthStore.getState().clearAuth();
      return false;
    }
  }

  async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    const { accessToken } = useAuthStore.getState();

    // Add auth header if token exists and not skipping auth
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (!skipAuth && accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      let response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle 401 - Unauthorized
      if (response.status === 401 && !skipAuth) {
        console.log('401 detected, attempting token refresh...');
        
        const refreshed = await this.refreshToken();
        
        if (refreshed) {
          // Retry the request with new token
          const newToken = useAuthStore.getState().accessToken;
          if (newToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, {
              ...fetchOptions,
              headers,
            });
          }
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          throw new Error('Authentication failed. Please login again.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Convenience methods
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;