import { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "../config/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  loginWithRedirect: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check authentication status on mount and when needed
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/protected`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUser(data.user); // User info from token
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loginWithRedirect = () => {
    // Redirect to backend login endpoint
    window.location.href = `${API_URL}/api/auth/login`;
  };

  const logout = async () => {
    // Call backend logout to clear cookie
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "DELETE",
      credentials: "include",
    });
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = "/login";
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
