import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiCall } from '@/lib/apiCall';
import { allRoutes } from '@/lib/apiRoutes';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  dairyId?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (userData: {
    name: string;
    phone: string;
    password: string;
    referralCode?: string;
  }) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // Verify token and get user data
          const response = await apiCall(allRoutes.auth.refresh, 'post');
          if (response.success) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.login, 'post', { phone, password });
      
      if (response.success) {
        // Store token (backend returns accessToken)
        localStorage.setItem('authToken', response.data.accessToken);
        
        // Set user data
        setUser(response.data.user);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: {
    name: string;
    phone: string;
    password: string;
    referralCode?: string;
  }): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.register, 'post', userData);
      
      if (response.success) {
        // Store token if auto-login is enabled
        if (response.data.accessToken) {
          localStorage.setItem('authToken', response.data.accessToken);
          setUser(response.data.user);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear local storage and state
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await apiCall(allRoutes.auth.refresh, 'post');
      if (response.success) {
        setUser(response.data.user);
      } else {
        // If refresh fails, logout user
        logout();
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, logout user
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 