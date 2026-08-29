import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/auth";

type AuthContextType = {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const refreshTokenFnRef = useRef<() => Promise<void>>(() => Promise.resolve());
  
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const userId = localStorage.getItem('userId');
      
      if (!refreshToken || !userId) {
        throw new Error('Missing tokens');
      }

      const response = await fetch(import.meta.env.VITE_API_BASE_URL + 'refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: refreshToken, 
          userId: parseInt(userId, 10) 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Refresh failed');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refresh.token);
      localStorage.setItem('userId', data.user.id.toString());
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      setCurrentUser(data.user);
      
      scheduleRefresh(5 * 60 * 1000);
    } catch (error) {
      console.error('Refresh token error:', error);
      logout();
    }
  }, []);

  useEffect(() => {
    refreshTokenFnRef.current = refreshToken;
  }, [refreshToken]);

  const scheduleRefresh = useCallback((delay: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    refreshTimerRef.current = setTimeout(() => {
      refreshTokenFnRef.current();
    }, delay);
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const userData = JSON.parse(localStorage.getItem('userData') || 'null');
          setCurrentUser(userData);
          scheduleRefresh(5 * 60 * 1000);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAuth();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleRefresh]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + 'login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login error');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refresh.token);
      localStorage.setItem('userId', data.user.id.toString());
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      setCurrentUser(data.user);
      scheduleRefresh(5 * 60 * 1000);
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error('Invalid credentials');
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
    setCurrentUser(null);
    
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}