import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiCall } from '../lib/apiCall';
import { allRoutes } from '../lib/apiRoutes';
import { User, LoginResponse, RegisterResponse, RefreshTokenResponse, ApiResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (name: string, phone: string, password: string, referralCode?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  forgotPassword: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, otp: string) => Promise<boolean>;
  changePassword: (phone: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    console.log('🔐 AuthContext initialization:', {
      hasToken: !!token,
      isAuth,
      timestamp: new Date().toISOString()
    });
    
    if (token && isAuth) {
      setIsAuthenticated(true);
      // Skip refresh token, just set loading to false
      setIsLoading(false);
      console.log('🔐 AuthContext: User authenticated from localStorage');
    } else {
      setIsLoading(false);
      console.log('🔐 AuthContext: No valid authentication found');
    }
  }, []);

  // Monitor authentication state changes
  useEffect(() => {
    console.log('🔐 AuthContext state changed:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, isLoading, user]);

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt for phone:', phone);
      const response = await apiCall(allRoutes.auth.login, 'post', { phone, password }) as ApiResponse<LoginResponse>;
      console.log('Login response:', response);
      
      if (response.success && response.data?.accessToken) {
        console.log('Login successful, setting token and user');
        localStorage.setItem('authToken', response.data.accessToken);
        localStorage.setItem('isAuthenticated', 'true');
        setUser(response.data.user || { id: 0, name: '', phone, dairyId: 0 });
        setIsAuthenticated(true);
        console.log('Login completed, returning true');
        return true;
      }
      console.log('Login failed - no access token');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, phone: string, password: string, referralCode?: string): Promise<boolean> => {
    try {
      const data: Record<string, string> = { name, phone, password };
      if (referralCode) {
        data.referralCode = referralCode;
      }
      
      const response = await apiCall(allRoutes.auth.register, 'post', data) as ApiResponse<RegisterResponse>;
      if (response.success && response.data?.accessToken) {
        localStorage.setItem('authToken', response.data.accessToken);
        localStorage.setItem('isAuthenticated', 'true');
        setUser(response.data.user || { id: 0, name, phone, dairyId: 0 });
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout API to invalidate token on server
      await apiCall(allRoutes.auth.logout, 'post');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    // Skip refresh token functionality - just set loading to false
    setIsLoading(false);
  };

  const forgotPassword = async (phone: string): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.forgotPassword, 'post', { phone });
      return response.success;
    } catch (error) {
      console.error('Forgot password error:', error);
      return false;
    }
  };

  const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.otpVerify, 'post', { phone, otp });
      return response.success;
    } catch (error) {
      console.error('OTP verification error:', error);
      return false;
    }
  };

  const changePassword = async (phone: string, newPassword: string, confirmPassword: string): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.changePassword, 'put', {
        phone,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return response.success;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    // Skip refresh token functionality
    return false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    forgotPassword,
    verifyOTP,
    changePassword,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 