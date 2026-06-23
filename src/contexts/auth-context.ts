import { createContext } from "react";
import type { DairySubscription, User, UserProfile } from "../types/auth";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSubscription: boolean;
  dairySubscription: DairySubscription | null;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (
    dairyCode: string,
    name: string,
    phone: string,
    password: string,
    village: string,
  ) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  forgotPassword: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, otp: string) => Promise<boolean>;
  changePassword: (
    phone: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  syncFromProfile: (profile: UserProfile) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
