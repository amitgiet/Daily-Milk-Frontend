import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Smartphone,
  QrCode,
  Key,
  History,
  Monitor,
  MapPin,
  Clock,
  Milk,
  CreditCard,
  Crown,
  Camera,
  Pencil,
  Check,
  Settings as SettingsGear,
  ChevronRight,
  CircleHelp,
  HardDrive,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";
import { useBackupFolder } from "@/hooks/useBackupFolder";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, ProfileSubscription, UserProfile } from "@/types/auth";
import { formatDisplayDateLong } from "@/lib/dateFormat";
import { cn, getProfilePictureUrl, resolveImageUrl } from "@/lib/utils";
import {
  DEFAULT_MILK_RATE_SETTINGS,
  fetchAndSyncMilkRateSettings,
  getMilkRateSettings,
  updateAndSyncMilkRateSettings,
} from "@/lib/milkRateStorage";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DATA_SAVING_PATH_OPTIONS,
  type DataSavingPath,
  getDataSavingPathDescription,
  getDataSavingPathsLabel,
  getSystemSettings,
  saveSystemSettings,
} from "@/lib/systemSettingsStorage";
import { BACKUP_FOLDER_JSON_FILES } from "@/lib/backupFileNames";

type AccountTab =
  | "profile"
  | "subscription"
  | "address"
  | "milkRates"
  | "security"
  | "notifications"
  | "system";

function formatMemberSince(value?: string | null) {
  if (!value) return "-";

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsed = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      )
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "MMMM d, yyyy");
}

function formatAddressLine(user?: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}) {
  if (!user) return "";

  const locationParts = [user.city, user.state].filter(Boolean);
  const locationLine = [
    locationParts.join(", "),
    user.pincode ? `- ${user.pincode}` : "",
  ]
    .join(" ")
    .trim();

  return [user.address, locationLine].filter(Boolean).join(", ");
}

function getBillingCycleLabel(durationDays: number, t: (key: string) => string) {
  if (durationDays === 30) return t("subscription.monthly");
  if (durationDays === 90) return t("subscription.quarterly");
  if (durationDays === 180) return t("subscription.biannual");
  if (durationDays === 365) return t("subscription.annual");
  return `${durationDays} days`;
}

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, dairySubscription, hasSubscription, updateUser, syncFromProfile } = useAuth();
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showLoginHistoryDialog, setShowLoginHistoryDialog] = useState(false);
  const [showTerminateSessionsDialog, setShowTerminateSessionsDialog] =
    useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [terminatePassword, setTerminatePassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTerminatePassword, setShowTerminatePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Milk Rate Settings State
  const [milkRateSettings, setMilkRateSettings] = useState({
    fatRate: "2.00",
    snfRate: "1.00",
    govtSubsidy: "0.00",
    formulaType: "fatOnly", // fatOnly, fatSnf
  });
  const [isLoadingMilkRates, setIsLoadingMilkRates] = useState(false);
  const [isSavingMilkRates, setIsSavingMilkRates] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [userData, setUserData] = useState(user);
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showEditAddressDialog, setShowEditAddressDialog] = useState(false);
  const [profileSubscription, setProfileSubscription] =
    useState<ProfileSubscription | null>(null);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);
  const [dataSavingPaths, setDataSavingPaths] = useState<DataSavingPath[]>(["indexeddb"]);
  const [isSavingSystemSettings, setIsSavingSystemSettings] = useState(false);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const {
    isSupported: isBackupSupported,
    isConfigured: isBackupConfigured,
    folderName: backupFolderName,
    status: backupStatus,
    lastBackupAt,
    lastSyncAt,
    pendingSyncCount,
    permissionRevoked: isBackupPermissionRevoked,
    lastError: backupLastError,
    isSelecting: isSelectingBackupFolder,
    isRestoring: isRestoringBackup,
    selectBackupFolder,
    restoreFromBackup,
    getStatusLabelKey,
    isBackupError,
  } = useBackupFolder();

  const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    if (user) setUserData(user);
  }, [user]);

  useEffect(() => {
    const settings = getSystemSettings();
    setDataSavingPaths(settings.dataSavingPaths);
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoadingProfile(true);
    try {
      const response = await apiCall(allRoutes.users.profile, "get");
      if (response.success && response.data) {
        const profile = (response.data.data || response.data) as UserProfile;
        setProfileSubscription(profile.subscription ?? null);
        syncFromProfile(profile);
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                dairyCode: profile.dairyCode ?? prev.dairyCode,
                address: profile.address ?? prev.address,
                city: profile.city ?? prev.city,
                state: profile.state ?? prev.state,
                pincode: profile.pincode ?? prev.pincode,
                referralCode: profile.referralCode ?? prev.referralCode,
                profilePicture:
                  getProfilePictureUrl(profile) ?? prev.profilePicture,
                createdAt:
                  profile.createdAt ??
                  profile.subscription?.startDate ??
                  prev.createdAt,
              }
            : prev,
        );
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast.error(t("settings.failedToLoadProfile"));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user?.id]);

  const handleProfilePictureSelect = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("settings.invalidProfilePictureType"));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_PICTURE_SIZE) {
      toast.error(t("settings.profilePictureTooLarge"));
      event.target.value = "";
      return;
    }

    setIsUploadingProfilePicture(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await apiCall(
        allRoutes.users.updateProfilePicture,
        "put",
        formData,
      );

      if (response.success) {
        const profilePictureUrl = resolveImageUrl(
          (response.data as { data?: { profilePictureUrl?: string } })?.data
            ?.profilePictureUrl,
        );

        if (profilePictureUrl) {
          updateUser({ profilePicture: profilePictureUrl });
          setUserData((prev) =>
            prev ? { ...prev, profilePicture: profilePictureUrl } : prev,
          );
        }

        toast.success(
          (response.data as { message?: string })?.message ||
            t("settings.profilePictureUpdated"),
        );
      } else {
        toast.error(t("settings.failedToUpdateProfilePicture"));
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error(t("settings.failedToUpdateProfilePicture"));
    } finally {
      setIsUploadingProfilePicture(false);
      event.target.value = "";
    }
  };

  // Load milk rate settings on component mount (admin and dairy users)
  useEffect(() => {
    if (user && (user.roleId === UserRole.ADMIN || user.roleId === UserRole.DAIRY)) {
      loadMilkRateSettings();
    }
  }, [user]);

  const loadMilkRateSettings = async () => {
    if (!user || (user.roleId !== UserRole.ADMIN && user.roleId !== UserRole.DAIRY)) {
      return;
    }

    setIsLoadingMilkRates(true);
    try {
      const cachedSettings = await getMilkRateSettings();
      setMilkRateSettings(cachedSettings);

      const settings = await fetchAndSyncMilkRateSettings();
      setMilkRateSettings(settings);
    } catch (error) {
      console.error("Error loading milk rate settings:", error);
      setMilkRateSettings(DEFAULT_MILK_RATE_SETTINGS);
      toast.error(t("settings.usingLocalSettings"));
    } finally {
      setIsLoadingMilkRates(false);
    }
  };

  const handleSaveMilkRates = async () => {
    // Double-check that only admin users can save milk rate settings
    if (!user || user.roleId !== UserRole.DAIRY) {
      toast.error(t("settings.unauthorized"));
      return;
    }
    
    setIsSavingMilkRates(true);
    try {
      const { success, settings } = await updateAndSyncMilkRateSettings(milkRateSettings);

      if (success) {
        setMilkRateSettings(settings);
        toast.success(t("settings.milkRateSettingsUpdated"));
      } else {
        toast.error(t("settings.failedToUpdateMilkRates"));
      }
    } catch (error) {
      console.error("Error saving milk rate settings:", error);
      toast.error(t("settings.failedToSaveMilkRates"));
    } finally {
      setIsSavingMilkRates(false);
    }
  };

  const handlePasswordChange = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error(t("settings.fillAllPasswordFields"));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t("settings.passwordsDoNotMatch"));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t("settings.passwordMinLength"));
      return;
    }
    const response = await apiCall(allRoutes.auth.changePassword, "post", {
      phone: userData?.phone,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
    });
    if (response.success) {
      toast.success(t("settings.passwordChanged"));
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      toast.error(t("settings.failedToChangePassword")); 
    }
  };

  const handleEnable2FA = () => {
    if (verificationCode.length !== 6) {
      alert(t("settings.enter6DigitCode"));
      return;
    }

    // Simulate 2FA verification
    if (verificationCode === "123456") {
      setTwoFactorEnabled(true);
      alert(t("settings.enable2FASuccess"));
      setShow2FADialog(false);
      setTwoFactorStep(1);
      setVerificationCode("");
    } else {
      alert(t("settings.invalidVerificationCode"));
    }
  };

  const handleDisable2FA = () => {
    if (verificationCode.length !== 6) {
      alert(t("settings.enter6DigitCodeToDisable"));
      return;
    }

    // Simulate 2FA verification for disabling
    if (verificationCode === "123456") {
      setTwoFactorEnabled(false);
      alert(t("settings.disable2FASuccess"));
      setShow2FADialog(false);
      setTwoFactorStep(1);
      setVerificationCode("");
    } else {
      alert(t("settings.invalidVerificationCode"));
    }
  };

  // Sample login history data
  const loginHistory = [
    {
      id: 1,
      date: "2024-07-25",
      time: "09:15 AM",
      device: "Windows PC",
      browser: "Chrome 126.0",
      location: "Mumbai, India",
      ip: "192.168.1.100",
      status: "Success",
    },
    {
      id: 2,
      date: "2024-07-24",
      time: "06:30 PM",
      device: "Android Phone",
      browser: "Chrome Mobile",
      location: "Mumbai, India",
      ip: "192.168.1.105",
      status: "Success",
    },
    {
      id: 3,
      date: "2024-07-24",
      time: "10:45 AM",
      device: "Windows PC",
      browser: "Chrome 126.0",
      location: "Mumbai, India",
      ip: "192.168.1.100",
      status: "Success",
    },
    {
      id: 4,
      date: "2024-07-23",
      time: "08:20 AM",
      device: "iPad",
      browser: "Safari",
      location: "Pune, India",
      ip: "192.168.2.50",
      status: "Success",
    },
    {
      id: 5,
      date: "2024-07-22",
      time: "11:30 PM",
      device: "Unknown Device",
      browser: "Chrome 125.0",
      location: "Delhi, India",
      ip: "203.192.45.67",
      status: "Failed",
    },
  ];

  const handleExportHistory = () => {
    // Create CSV content
    const headers = [
      t("settings.dateTime"),
      t("settings.device"),
      t("settings.browser"),
      t("settings.location"),
      t("settings.ipAddress"),
      t("settings.status"),
    ];
    const csvContent = [
      headers.join(","),
      ...loginHistory.map((login) =>
        [
          login.date,
          login.time,
          `"${login.device}"`,
          `"${login.browser}"`,
          `"${login.location}"`,
          login.ip,
          login.status,
        ].join(",")
      ),
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const fileName = `login-history-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`${t("settings.loginHistoryExported")} ${fileName}`);
  };

  const handleTerminateAllSessions = () => {
    if (!terminatePassword) {
      alert(t("settings.enterPasswordToConfirmTermination"));
      return;
    }

    // Simulate password verification (in real app, this would verify against actual password)
    if (terminatePassword === "admin123") {
      // Simulate terminating all sessions
      alert(t("settings.allSessionsTerminatedSuccess"));
      setShowTerminateSessionsDialog(false);
      setShowLoginHistoryDialog(false);
      setTerminatePassword("");

      // In a real app, this would redirect to login page or refresh the authentication state
      setTimeout(() => {
        alert(t("settings.redirectingToLogin"));
      }, 1000);
    } else {
      alert(t("settings.invalidPassword"));
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData?.name?.trim() || !userData?.email?.trim() || !userData?.phone?.trim()) {
      toast.error(t("settings.fillAllProfileFields"));
      return;
    }

    const response = await apiCall(allRoutes.users.updateProfile, "post", {
      name: userData.name.trim(),
      email: userData.email.trim(),
      phone: userData.phone.trim(),
    });

    if (response.success) {
      const updatedProfile = {
        name: userData.name.trim(),
        email: userData.email.trim(),
        phone: userData.phone.trim(),
      };
      updateUser(updatedProfile);
      setUserData((prev) => (prev ? { ...prev, ...updatedProfile } : prev));
      toast.success(t("settings.profileUpdated"));
      setShowEditProfileDialog(false);
      await loadProfile();
    } else {
      toast.error(t("settings.failedToUpdateProfile"));
    }
  };

  const handleUpdateAddress = async () => {
    if (
      !userData?.address?.trim() ||
      !userData?.city?.trim() ||
      !userData?.state?.trim() ||
      !userData?.pincode?.trim()
    ) {
      toast.error(t("settings.fillAddressFields"));
      return;
    }

    const updatedAddress = {
      address: userData.address.trim(),
      city: userData.city.trim(),
      state: userData.state.trim(),
      pincode: userData.pincode.trim(),
    };

    const response = await apiCall(allRoutes.users.updateAddress, "put", updatedAddress);

    if (response.success) {
      updateUser(updatedAddress);
      setUserData((prev) => (prev ? { ...prev, ...updatedAddress } : prev));
      toast.success(
        (response.data as { message?: string })?.message ||
          t("settings.addressUpdated")
      );
      setShowEditAddressDialog(false);
      await loadProfile();
    } else {
      toast.error(t("settings.failedToUpdateAddress"));
    }
  };

  const isDairyUser = user?.roleId === UserRole.DAIRY;
  const isSubscriptionActive = profileSubscription
    ? profileSubscription.status === "active"
    : hasSubscription && dairySubscription?.status === "active";

  const handleSelectBackupFolder = async () => {
    if (!isBackupSupported) {
      toast.error(t("settings.backupFolderUnsupported"));
      return;
    }

    try {
      const result = await selectBackupFolder();
      if (!result) return;

      if (result.metadata.status === "error" && result.metadata.lastError) {
        toast.warning(
          t("settings.backupFolderSelectedWithWarning", {
            folderName: result.folderName,
          }),
        );
        return;
      }

      toast.success(
        t("settings.backupFolderSelected", { folderName: result.folderName }),
      );
    } catch (error) {
      console.error("Failed to select backup folder:", error);
      if (isBackupError(error)) {
        if (error.code === "UNSUPPORTED") {
          toast.error(t("settings.backupFolderUnsupported"));
        } else if (error.code === "PERMISSION_DENIED") {
          toast.error(t("settings.backupPermissionDenied"));
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.error(t("settings.failedToSelectBackupFolder"));
    }
  };

  const handleRestoreFromBackup = async () => {
    try {
      const result = await restoreFromBackup();
      toast.success(
        t("settings.backupRestoreSuccess", {
          restored: result.restored,
          skipped: result.skipped,
        }),
      );
    } catch (error) {
      console.error("Failed to restore from backup:", error);
      if (isBackupError(error)) {
        toast.error(error.message);
        return;
      }
      toast.error(t("settings.failedToRestoreBackup"));
    }
  };

  const formatBackupTimestamp = (value: string | null) => {
    if (!value) return t("settings.backupNever");
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return t("settings.backupNever");
    return format(parsed, "PPpp");
  };

  const toggleDataSavingPath = (path: DataSavingPath, checked: boolean) => {
    setDataSavingPaths((current) => {
      if (checked) {
        return current.includes(path) ? current : [...current, path];
      }

      if (current.length === 1) {
        toast.error(t("settings.selectAtLeastOneDataPath"));
        return current;
      }

      return current.filter((item) => item !== path);
    });
  };

  const handleSaveSystemSettings = async () => {
    if (dataSavingPaths.length === 0) {
      toast.error(t("settings.selectAtLeastOneDataPath"));
      return;
    }

    setIsSavingSystemSettings(true);
    try {
      saveSystemSettings({ dataSavingPaths });
      toast.success(t("settings.systemSettingsSaved"));
    } catch (error) {
      console.error("Failed to save system settings:", error);
      toast.error(t("settings.failedToSaveSystemSettings"));
    } finally {
      setIsSavingSystemSettings(false);
    }
  };

  const accountNavItems: { id: AccountTab; icon: typeof User; label: string }[] = [
    { id: "profile", icon: User, label: t("settings.profile") },
    { id: "subscription", icon: CreditCard, label: t("settings.subscriptionTab") },
    { id: "address", icon: MapPin, label: t("settings.addressDetails") },
    { id: "milkRates", icon: Milk, label: t("settings.milkRateSettings") },
    { id: "security", icon: Shield, label: t("settings.security") },
    { id: "notifications", icon: Bell, label: t("settings.notifications") },
    { id: "system", icon: HardDrive, label: t("settings.system") },
  ];

  const showProfileSection = activeTab === "profile";
  const showSubscriptionSection =
    activeTab === "profile" || activeTab === "subscription";
  const showAddressSection = activeTab === "profile" || activeTab === "address";
  const showMilkRatesSection = activeTab === "milkRates";
  const showSecuritySection = activeTab === "security";
  const showNotificationsSection = activeTab === "notifications";
  const showSystemSection = activeTab === "system";

  const renderProfileCard = () => (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            {t("settings.profileInformation")}
          </CardTitle>
          <CardDescription>{t("settings.profileInformationDesc")}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowEditProfileDialog(true)}
        >
          <Pencil className="h-4 w-4" />
          {t("settings.editProfile")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative shrink-0">
            <div className="h-24 w-24 rounded-full bg-green-50 border border-green-100 flex items-center justify-center overflow-hidden">
              {userData?.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt={userData.name}
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-primary/70" />
              )}
              {isUploadingProfilePicture && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-medium">
                  {t("settings.uploadingProfilePicture")}
                </div>
              )}
            </div>
            <input
              ref={profilePictureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureSelect}
            />
            <button
              type="button"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background shadow-sm disabled:opacity-50"
              aria-label={t("settings.uploadProfilePicture")}
              disabled={isUploadingProfilePicture}
              onClick={() => profilePictureInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-5 flex-1">
            <div>
              <p className="text-sm text-muted-foreground">{t("settings.name")}</p>
              <p className="text-lg font-semibold">{userData?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("settings.email")}</p>
              <p className="text-base">{userData?.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("settings.phone")}</p>
              <p className="text-base">{userData?.phone || "-"}</p>
            </div>
          </div>
          <div className="space-y-5 flex-1">
            <div>
              <p className="text-sm text-muted-foreground">{t("settings.dairyCode")}</p>
              <p className="text-lg font-semibold">{userData?.dairyCode || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("settings.referralCode")}</p>
              <p className="text-base">{userData?.referralCode || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("settings.memberSince")}</p>
              <p className="text-base">{formatMemberSince(
                userData?.createdAt ?? profileSubscription?.startDate
              )}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSubscriptionCard = () => (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-primary" />
            {t("settings.activeSubscription")}
          </CardTitle>
          <CardDescription>{t("settings.activeSubscriptionDesc")}</CardDescription>
        </div>
        <Badge
          className={cn(
            "rounded-full px-3 py-1 font-medium border-0",
            isSubscriptionActive
              ? "bg-green-100 text-green-700 hover:bg-green-100"
              : "bg-muted text-muted-foreground hover:bg-muted"
          )}
        >
          {isSubscriptionActive ? t("navigation.active") : t("navigation.noActiveSubscription")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.plan")}</p>
            <p className="font-semibold">
              {profileSubscription?.plan?.name ||
                (dairySubscription ? `Plan #${dairySubscription.planId}` : "-")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.billingCycle")}</p>
            <p className="font-medium">
              {profileSubscription?.plan?.durationDays
                ? getBillingCycleLabel(profileSubscription.plan.durationDays, t)
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.nextBillingDate")}</p>
            <p className="font-medium">
              {profileSubscription?.endDate
                ? formatDisplayDateLong(profileSubscription.endDate, "-")
                : dairySubscription?.endDate
                  ? formatDisplayDateLong(dairySubscription.endDate, "-")
                  : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.amount")}</p>
            <p className="font-semibold text-primary">
              {profileSubscription?.planPrice
                ? `₹${Number(profileSubscription.planPrice).toFixed(2)}`
                : "-"}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg px-4 py-3",
            isSubscriptionActive ? "bg-green-50" : "bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2 text-sm">
            {isSubscriptionActive ? (
              <>
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-green-800">{t("settings.subscriptionActiveMessage")}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{t("settings.subscriptionInactiveMessage")}</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-background shrink-0"
            onClick={() => navigate("/subscription-plans")}
          >
            <SettingsGear className="h-4 w-4" />
            {isSubscriptionActive ? t("settings.manageSubscription") : t("settings.viewPlans")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAddressCard = () => (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            {t("settings.addressDetails")}
          </CardTitle>
          <CardDescription>{t("settings.addressDetailsDesc")}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowEditAddressDialog(true)}
        >
          <Pencil className="h-4 w-4" />
          {t("settings.editAddress")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg border border-border/60 p-5 bg-muted/20">
          <Badge className="absolute top-4 right-4 rounded-full bg-green-100 text-green-700 border-0 hover:bg-green-100 gap-1">
            <Check className="h-3 w-3" />
            {t("settings.default")}
          </Badge>
          <div className="space-y-3 pr-24">
            <p className="font-semibold">{t("settings.defaultAddress")}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {formatAddressLine(userData) || t("settings.noAddressSaved")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMilkRateCard = () => (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Milk className="h-5 w-5 text-primary" />
          {t("settings.milkRateSettings")}
        </CardTitle>
        <CardDescription>{t("settings.configureMilkPricing")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingMilkRates ? (
          <div className="text-center py-4">
            {t("settings.loadingMilkRateSettings")}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="fatRate">{t("settings.fatRate")}</Label>
              <Input
                id="fatRate"
                type="number"
                step="0.01"
                min="0"
                value={milkRateSettings.fatRate}
                onChange={(e) =>
                  setMilkRateSettings((prev) => ({
                    ...prev,
                    fatRate: e.target.value,
                  }))
                }
                placeholder="2.00"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.fatRateDescription")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="snfRate">{t("settings.snfRate")}</Label>
              <Input
                id="snfRate"
                type="number"
                step="0.01"
                min="0"
                value={milkRateSettings.snfRate}
                onChange={(e) =>
                  setMilkRateSettings((prev) => ({
                    ...prev,
                    snfRate: e.target.value,
                  }))
                }
                placeholder="1.00"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.snfRateDescription")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="govtSubsidy">{t("settings.govtSubsidy")}</Label>
              <Input
                id="govtSubsidy"
                type="number"
                step="0.01"
                min="0"
                value={milkRateSettings.govtSubsidy}
                onChange={(e) =>
                  setMilkRateSettings((prev) => ({
                    ...prev,
                    govtSubsidy: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.govtSubsidyDescription")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formulaType">{t("settings.formulaType")}</Label>
              <Select
                value={milkRateSettings.formulaType}
                onValueChange={(value: "fatOnly" | "fatSnf") =>
                  setMilkRateSettings((prev) => ({
                    ...prev,
                    formulaType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fatOnly">{t("settings.fatOnly")}</SelectItem>
                  <SelectItem value="fatSnf">{t("settings.fatSnf")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveMilkRates}
              disabled={isSavingMilkRates}
              className="w-full sm:w-auto"
            >
              {isSavingMilkRates ? t("settings.saving") : t("settings.saveMilkRateSettings")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderChangePasswordForm = (idPrefix = "security") => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-currentPassword`}>{t("settings.currentPassword")}</Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-currentPassword`}
            type={showCurrentPassword ? "text" : "password"}
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            placeholder={t("settings.currentPasswordPlaceholder")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-newPassword`}>{t("settings.newPassword")}</Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-newPassword`}
            type={showNewPassword ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            placeholder={t("settings.newPasswordPlaceholder")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.passwordMinLength")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-confirmPassword`}>{t("settings.confirmPassword")}</Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-confirmPassword`}
            type={showConfirmPassword ? "text" : "password"}
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            placeholder={t("settings.confirmPasswordPlaceholder")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {passwordData.newPassword && (
        <div className="space-y-2">
          <Label className="text-sm">{t("settings.passwordStrength")}</Label>
          <div className="flex space-x-1">
            <div
              className={cn(
                "h-2 w-full rounded",
                passwordData.newPassword.length >= 6 ? "bg-green-500" : "bg-gray-200"
              )}
            />
            <div
              className={cn(
                "h-2 w-full rounded",
                passwordData.newPassword.length >= 8 &&
                  /[A-Z]/.test(passwordData.newPassword)
                  ? "bg-green-500"
                  : "bg-gray-200"
              )}
            />
            <div
              className={cn(
                "h-2 w-full rounded",
                passwordData.newPassword.length >= 8 &&
                  /[0-9]/.test(passwordData.newPassword) &&
                  /[!@#$%^&*]/.test(passwordData.newPassword)
                  ? "bg-green-500"
                  : "bg-gray-200"
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {passwordData.newPassword.length < 6
              ? t("settings.weak")
              : passwordData.newPassword.length >= 8 &&
                  /[A-Z]/.test(passwordData.newPassword) &&
                  /[0-9]/.test(passwordData.newPassword) &&
                  /[!@#$%^&*]/.test(passwordData.newPassword)
                ? t("settings.veryStrong")
                : passwordData.newPassword.length >= 8 &&
                    /[A-Z]/.test(passwordData.newPassword)
                  ? t("settings.strong")
                  : t("settings.medium")}
          </p>
        </div>
      )}

      <Button
        onClick={handlePasswordChange}
        disabled={
          !passwordData.currentPassword ||
          !passwordData.newPassword ||
          !passwordData.confirmPassword
        }
        className="w-full sm:w-auto"
      >
        {t("settings.changePassword")}
      </Button>
    </div>
  );

  const renderSecurityCard = () => (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t("settings.securitySettings")}
        </CardTitle>
        <CardDescription>{t("settings.manageSecuritySettings")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border/60 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t("settings.changePassword")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("settings.changePasswordDesc")}
              </p>
            </div>
          </div>
          {renderChangePasswordForm("dairy-security")}
        </div>
      </CardContent>
    </Card>
  );

  const renderNotificationsCard = () => (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {t("settings.notifications")}
        </CardTitle>
        <CardDescription>{t("settings.preferences")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">{t("settings.notifications")}</p>
            <p className="text-sm text-muted-foreground">
              {t("settings.manageProfilePreferences")}
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );

  const renderSystemCard = () => (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          {t("settings.systemSettings")}
        </CardTitle>
        <CardDescription>{t("settings.systemSettingsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>{t("settings.dataSavingPaths")}</Label>
          <p className="text-sm text-muted-foreground">
            {t("settings.selectDataSavingPaths")}
          </p>
          <div className="space-y-3">
            {DATA_SAVING_PATH_OPTIONS.map((path) => {
              const pathLabelKey =
                path === "indexeddb"
                  ? "settings.dataPathIndexedDb"
                  : "settings.dataPathLocalStorage";

              return (
                <div
                  key={path}
                  className="flex items-start gap-3 rounded-lg border bg-background p-4"
                >
                  <Checkbox
                    id={`data-saving-path-${path}`}
                    checked={dataSavingPaths.includes(path)}
                    onCheckedChange={(checked) =>
                      toggleDataSavingPath(path, checked === true)
                    }
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={`data-saving-path-${path}`}
                      className="cursor-pointer font-medium"
                    >
                      {t(pathLabelKey)}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {getDataSavingPathDescription(path)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium">{t("settings.currentDataPath")}</p>
          <p className="text-sm text-muted-foreground">
            {getDataSavingPathsLabel(dataSavingPaths)}
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <FolderOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">{t("settings.localBackupTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("settings.localBackupDesc")}
              </p>
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                {BACKUP_FOLDER_JSON_FILES.map((fileName) => (
                  <li key={fileName}>{fileName}</li>
                ))}
              </ul>
            </div>
          </div>

          {!isBackupSupported && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{t("settings.backupFolderUnsupported")}</p>
            </div>
          )}

          {isBackupPermissionRevoked && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{t("settings.backupPermissionRevokedWarning")}</p>
            </div>
          )}

          {backupLastError && backupStatus === "error" && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{backupLastError}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border bg-background p-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("settings.backupFolderSelectedLabel")}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={isBackupConfigured ? "default" : "secondary"}>
                  {isBackupConfigured
                    ? t("common.yes")
                    : t("common.no")}
                </Badge>
                {backupFolderName && (
                  <span className="text-sm font-medium truncate">{backupFolderName}</span>
                )}
              </div>
            </div>

            <div className="rounded-md border bg-background p-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("settings.backupStatus")}
              </p>
              <p className="text-sm font-medium">{t(getStatusLabelKey(backupStatus))}</p>
            </div>

            <div className="rounded-md border bg-background p-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("settings.lastBackupTime")}
              </p>
              <p className="text-sm font-medium">{formatBackupTimestamp(lastBackupAt)}</p>
            </div>

            <div className="rounded-md border bg-background p-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("settings.pendingSyncCount")}
              </p>
              <p className="text-sm font-medium">{pendingSyncCount}</p>
            </div>
          </div>

          {lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              {t("settings.lastSyncTime")}: {formatBackupTimestamp(lastSyncAt)}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSelectBackupFolder}
              disabled={isSelectingBackupFolder}
            >
              {isSelectingBackupFolder
                ? t("settings.saving")
                : isBackupConfigured
                  ? t("settings.reselectBackupFolder")
                  : t("settings.selectBackupFolder")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRestoreFromBackup}
              disabled={!isBackupConfigured || isRestoringBackup}
            >
              {isRestoringBackup
                ? t("settings.saving")
                : t("settings.restoreFromBackup")}
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSaveSystemSettings}
          disabled={isSavingSystemSettings}
        >
          {isSavingSystemSettings ? t("settings.saving") : t("settings.saveSystemSettings")}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      {isDairyUser ? (
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t("settings.myAccount")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("settings.manageProfilePreferences")}
              </p>
            </div>
            <nav className="space-y-1">
              {accountNavItems.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeTab === id
                      ? "bg-green-50 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="rounded-lg bg-green-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary font-medium">
                <CircleHelp className="h-4 w-4" />
                {t("settings.needHelp")}
              </div>
              <p className="text-sm text-muted-foreground">{t("settings.needHelpDesc")}</p>
              <button
                type="button"
                className="text-sm font-medium text-primary flex items-center gap-1 hover:underline"
              >
                {t("settings.contactSupport")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </aside>

          <div className="flex-1 space-y-6 min-w-0">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                {t("settings.loadingProfile")}
              </div>
            ) : (
              <>
                {showProfileSection && renderProfileCard()}
                {showSubscriptionSection && renderSubscriptionCard()}
                {showAddressSection && renderAddressCard()}
                {showSecuritySection && renderSecurityCard()}
                {showNotificationsSection && renderNotificationsCard()}
                {showMilkRatesSection && renderMilkRateCard()}
                {showSystemSection && renderSystemCard()}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
            <p className="text-muted-foreground">{t("settings.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t("settings.userProfile")}
            </CardTitle>
            <CardDescription>{t("settings.manageAccountSettings")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
 
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settings.name")}</label>
              <input
                type="text"
                value={userData?.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="w-full p-2 border border-border rounded-md bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settings.email")}</label>
              <input
                type="email"
                value={userData?.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="w-full p-2 border border-border rounded-md bg-background"
              />
            </div>
            <Button onClick={handleUpdateProfile}>{t("settings.updateProfile")}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t("settings.securitySettings")}
            </CardTitle>
            <CardDescription>{t("settings.manageSecuritySettings")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border/60 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("settings.changePassword")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("settings.changePasswordDesc")}
                  </p>
                </div>
              </div>
              {renderChangePasswordForm("admin-security")}
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.editProfile")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">{t("settings.name")}</Label>
              <Input
                id="editName"
                value={userData?.name || ""}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">{t("settings.email")}</Label>
              <Input
                id="editEmail"
                type="email"
                value={userData?.email || ""}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">{t("settings.phone")}</Label>
              <Input
                id="editPhone"
                type="phone"
                value={userData?.phone || ""}
                onChange={(e) =>
                  setUserData({ ...userData, phone: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditProfileDialog(false)}>
                {t("settings.cancel")}
              </Button>
              <Button onClick={handleUpdateProfile}>{t("settings.updateProfile")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={showEditAddressDialog} onOpenChange={setShowEditAddressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.editAddress")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editAddress">{t("settings.address")}</Label>
              <textarea
                id="editAddress"
                value={userData?.address || ""}
                onChange={(e) =>
                  setUserData({ ...userData, address: e.target.value })
                }
                placeholder={t("settings.addressPlaceholder")}
                rows={4}
                className="w-full p-2 border border-border rounded-md bg-background resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCity">{t("settings.city")}</Label>
              <Input
                id="editCity"
                value={userData?.city || ""}
                onChange={(e) =>
                  setUserData({ ...userData, city: e.target.value })
                }
                placeholder={t("settings.cityPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editState">{t("settings.state")}</Label>
              <Input
                id="editState"
                value={userData?.state || ""}
                onChange={(e) =>
                  setUserData({ ...userData, state: e.target.value })
                }
                placeholder={t("settings.statePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPincode">{t("settings.pincode")}</Label>
              <Input
                id="editPincode"
                value={userData?.pincode || ""}
                onChange={(e) =>
                  setUserData({ ...userData, pincode: e.target.value })
                }
                placeholder={t("settings.pincodePlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditAddressDialog(false)}>
                {t("settings.cancel")}
              </Button>
              <Button onClick={handleUpdateAddress}>{t("common.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {twoFactorEnabled
                ? t("settings.disable2FA")
                : t("settings.enable2FA")}
            </DialogTitle>
          </DialogHeader>

          {!twoFactorEnabled ? (
            <div className="space-y-6">
              {twoFactorStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-6 bg-muted rounded-lg">
                        <Smartphone className="h-12 w-12 mx-auto text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        {t("settings.installAuthenticatorApp")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.installAuthenticatorDescription")}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setTwoFactorStep(2)}>
                      {t("settings.nextStep")}
                    </Button>
                  </div>
                </div>
              )}

              {twoFactorStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                        <QrCode className="h-24 w-24 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{t("settings.scanQRCode")}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t("settings.scanQRDescription")}
                      </p>
                      <div className="bg-muted p-3 rounded text-sm">
                        <p className="font-medium mb-1">{t("settings.manualEntryKey")}</p>
                        <p className="font-mono text-xs break-all">
                          JBSWY3DPEHPK3PXP
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setTwoFactorStep(1)}
                    >
                      {t("settings.back")}
                    </Button>
                    <Button onClick={() => setTwoFactorStep(3)}>
                      {t("settings.iveAddedAccount")}
                    </Button>
                  </div>
                </div>
              )}

              {twoFactorStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-6 bg-muted rounded-lg">
                        <Key className="h-12 w-12 mx-auto text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        {t("settings.enterVerificationCode")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.verificationCodeDescription")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("settings.verificationCode")}</Label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder={t("settings.verificationCodePlaceholder")}
                      className="text-center text-lg tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("settings.useCodeForDemo")}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setTwoFactorStep(2)}
                    >
                      {t("settings.back")}
                    </Button>
                    <Button
                      onClick={handleEnable2FA}
                      disabled={verificationCode.length !== 6}
                    >
                      {t("settings.enable2FA")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Disable 2FA Flow
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-6 bg-red-50 rounded-lg">
                    <Shield className="h-12 w-12 mx-auto text-red-500" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">
                    {t("settings.disable2FA")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.disable2FADescription")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("settings.verificationCode")}</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder={t("settings.verificationCodePlaceholder")}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.useCodeForDemo")}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShow2FADialog(false)}
                >
                  {t("settings.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={verificationCode.length !== 6}
                >
                  {t("settings.disable2FA")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog
        open={showLoginHistoryDialog}
        onOpenChange={setShowLoginHistoryDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Login History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Recent login activities for your account
              </p>
              <Button variant="outline" size="sm" onClick={handleExportHistory}>
                Export History
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-auto max-h-96">
                <div className="grid gap-0">
                  {/* Header */}
                  <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 font-medium text-sm border-b">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Date & Time
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Device
                    </div>
                    <div>Browser</div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </div>
                    <div>IP Address</div>
                    <div>Status</div>
                  </div>

                  {/* Login History Rows */}
                  {loginHistory.map((login, index) => (
                    <div
                      key={login.id}
                      className={`grid grid-cols-6 gap-4 p-4 text-sm hover:bg-muted/30 transition-colors ${
                        index !== loginHistory.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{login.date}</p>
                        <p className="text-muted-foreground text-xs">
                          {login.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {login.device.includes("Windows") && (
                          <Monitor className="h-4 w-4 text-blue-500" />
                        )}
                        {login.device.includes("Android") && (
                          <Smartphone className="h-4 w-4 text-green-500" />
                        )}
                        {login.device.includes("iPad") && (
                          <Monitor className="h-4 w-4 text-gray-500" />
                        )}
                        {login.device.includes("Unknown") && (
                          <Monitor className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{login.device}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {login.browser}
                      </div>
                      <div className="space-y-1">
                        <p>{login.location}</p>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {login.ip}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            login.status === "Success"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {login.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Security Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Check for any unfamiliar login attempts</li>
                <li>
                  • If you see suspicious activity, change your password
                  immediately
                </li>
                <li>
                  • Consider enabling Two-Factor Authentication for extra
                  security
                </li>
                <li>• Always log out from shared or public computers</li>
              </ul>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing last 5 login attempts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLoginHistoryDialog(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowTerminateSessionsDialog(true)}
                >
                  Terminate All Sessions
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terminate All Sessions Dialog */}
      <Dialog
        open={showTerminateSessionsDialog}
        onOpenChange={setShowTerminateSessionsDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Terminate All Sessions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-6 bg-red-50 rounded-lg">
                  <Shield className="h-12 w-12 mx-auto text-red-500" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-600">
                  Warning: This action cannot be undone
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will log you out from all devices and browsers where
                  you're currently signed in, including this current session.
                  You'll need to log in again on all devices.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">
                What will happen:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• All active sessions will be immediately terminated</li>
                <li>• You'll be logged out from all devices and browsers</li>
                <li>• Any unsaved work may be lost</li>
                <li>• You'll need to log in again to access your account</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminatePassword">
                Enter your password to confirm
              </Label>
              <div className="relative">
                <Input
                  id="terminatePassword"
                  type={showTerminatePassword ? "text" : "password"}
                  value={terminatePassword}
                  onChange={(e) => setTerminatePassword(e.target.value)}
                  placeholder="Enter your current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setShowTerminatePassword(!showTerminatePassword)
                  }
                >
                  {showTerminatePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use password: admin123 for demo
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTerminateSessionsDialog(false);
                  setTerminatePassword("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleTerminateAllSessions}
                disabled={!terminatePassword}
              >
                Terminate All Sessions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
