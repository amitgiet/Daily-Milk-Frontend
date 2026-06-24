import React, { useEffect, useState, ReactNode, useCallback } from "react";
import { apiCall } from "../lib/apiCall";
import { allRoutes } from "../lib/apiRoutes";
import { getProfilePictureUrl } from "../lib/utils";
import { isSubscriptionActive, toDairySubscription } from "../lib/permissions";
import {
  User,
  RegisterResponse,
  ApiResponse,
  DairySubscription,
  UserProfile,
  ProfileSubscription,
} from "../types/auth";
import { AuthContext, AuthContextType } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

function resolveLoginSubscription(
  responseData: {
    subscription?: boolean | ProfileSubscription | null;
    DairySubscription?: DairySubscription | null;
    user?: (User & { subscription?: ProfileSubscription | null }) | null;
  },
) {
  const user = responseData.user;
  const profileSubscription =
    (typeof responseData.subscription === "object" && responseData.subscription
      ? responseData.subscription
      : null) ?? user?.subscription ?? null;

  const dairySub =
    responseData.DairySubscription ??
    toDairySubscription(profileSubscription, user?.id ?? 0);

  const subscriptionActive =
    responseData.subscription === true ||
    isSubscriptionActive(dairySub);

  return { subscriptionActive, dairySub };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [dairySubscription, setDairySubscription] =
    useState<DairySubscription | null>(null);

  const applySubscriptionState = useCallback(
    (subscriptionActive: boolean, dairySub: DairySubscription | null) => {
      setHasSubscription(subscriptionActive);
      setDairySubscription(dairySub);
      localStorage.setItem("hasSubscription", JSON.stringify(subscriptionActive));
      localStorage.setItem("dairySubscription", JSON.stringify(dairySub));
    },
    [],
  );

  const syncFromProfile = useCallback(
    (profile: UserProfile) => {
      setUser((prev) => {
        const updatedUser: User = {
          ...(prev ?? {
            id: profile.id,
            name: profile.name,
            phone: profile.phone,
            dairyCode: profile.dairyCode ?? "",
            dairyId: profile.subscription?.dairyId ?? profile.id,
            roleId: 2,
          }),
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          dairyCode: profile.dairyCode ?? prev?.dairyCode ?? "",
          dairyId: profile.subscription?.dairyId ?? profile.id ?? prev?.dairyId ?? null,
          address: profile.address ?? prev?.address,
          city: profile.city ?? prev?.city,
          state: profile.state ?? prev?.state,
          pincode: profile.pincode ?? prev?.pincode,
          profilePicture:
            getProfilePictureUrl(profile) ?? prev?.profilePicture,
          referralCode: profile.referralCode ?? prev?.referralCode,
          createdAt:
            profile.createdAt ??
            profile.subscription?.startDate ??
            prev?.createdAt,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      });

      const dairySub = toDairySubscription(
        profile.subscription,
        profile.subscription?.dairyId ?? profile.id,
      );
      const subscriptionActive = isSubscriptionActive(dairySub);
      applySubscriptionState(subscriptionActive, dairySub);
    },
    [applySubscriptionState],
  );

  useEffect(() => {
    async function initializeAuth() {
      const token = localStorage.getItem("authToken");
      const isAuth = localStorage.getItem("isAuthenticated") === "true";
      const storedUser = localStorage.getItem("user");
      const storedSubscription = localStorage.getItem("hasSubscription");
      const storedDairySubscription = localStorage.getItem("dairySubscription");

      if (token && isAuth) {
        setIsAuthenticated(true);

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error("Error parsing stored user data:", error);
          }
        }

        if (storedSubscription) {
          try {
            setHasSubscription(JSON.parse(storedSubscription));
          } catch (error) {
            console.error("Error parsing stored subscription data:", error);
            setHasSubscription(false);
          }
        }

        if (storedDairySubscription) {
          try {
            setDairySubscription(JSON.parse(storedDairySubscription));
          } catch (error) {
            console.error("Error parsing stored dairy subscription data:", error);
            setDairySubscription(null);
          }
        }

        try {
          const response = await apiCall(allRoutes.users.profile, "get");
          if (response.success && response.data) {
            const profile = (response.data.data || response.data) as UserProfile;
            syncFromProfile(profile);
          }
        } catch (error) {
          console.error("Failed to refresh subscription from profile:", error);
        }
      }

      setIsLoading(false);
    }

    initializeAuth();
  }, [syncFromProfile]);

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.login, "post", {
        phone,
        password,
      });

      if (response.success && response.data?.accessToken) {
        localStorage.setItem("authToken", response.data.accessToken);
        localStorage.setItem("isAuthenticated", "true");

        const { subscriptionActive, dairySub } = resolveLoginSubscription(
          response.data,
        );

        const rawUser = response.data.user || {
          id: 0,
          name: "",
          phone,
          dairyId: 0,
          roleId: 1,
        };
        const userData: User = {
          ...rawUser,
          dairyId:
            rawUser.dairyId && rawUser.dairyId > 0
              ? rawUser.dairyId
              : rawUser.subscription?.dairyId ??
                dairySub?.dairyId ??
                rawUser.dairyId ??
                null,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        applySubscriptionState(subscriptionActive, dairySub);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (
    dairyCode: string,
    name: string,
    phone: string,
    password: string,
    village: string,
  ): Promise<boolean> => {
    try {
      const data: Record<string, string> = { dairyCode, name, phone, password };
      if (village) {
        data.village = village;
      }

      const response = (await apiCall(
        allRoutes.auth.register,
        "post",
        data,
      )) as ApiResponse<RegisterResponse>;

      return response.success;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiCall(allRoutes.auth.logout, "post", {});
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      localStorage.removeItem("hasSubscription");
      localStorage.removeItem("dairySubscription");

      setUser(null);
      setIsAuthenticated(false);
      setHasSubscription(false);
      setDairySubscription(null);
    }
  };

  const refreshUser = async () => {
    setIsLoading(false);
  };

  const forgotPassword = async (phone: string): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.forgotPassword, "post", {
        phone,
      });
      return response.success;
    } catch (error) {
      console.error("Forgot password error:", error);
      return false;
    }
  };

  const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.otpVerify, "post", {
        phone,
        otp,
      });
      return response.success;
    } catch (error) {
      console.error("OTP verification error:", error);
      return false;
    }
  };

  const changePassword = async (
    phone: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<boolean> => {
    try {
      const response = await apiCall(allRoutes.auth.changePassword, "put", {
        phone,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      return response.success;
    } catch (error) {
      console.error("Change password error:", error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => false;

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    hasSubscription,
    dairySubscription,
    login,
    register,
    logout,
    refreshUser,
    forgotPassword,
    verifyOTP,
    changePassword,
    refreshToken,
    updateUser,
    syncFromProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
