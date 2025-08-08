import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Settings as SettingsIcon,
  User,
  Bell,
  Database,
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
} from "lucide-react";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface MilkRateSettings {
  fatRate: number | string;
  snfRate: number | string;
  formulaType: "fatOnly" | "fatSnf";
}

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
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
    formulaType: "fatOnly", // fatOnly, fatSnf
  });
  const [isLoadingMilkRates, setIsLoadingMilkRates] = useState(false);
  const [isSavingMilkRates, setIsSavingMilkRates] = useState(false);
  const [userData, setUserData] = useState(user);

  // Load milk rate settings on component mount (only for admin users)
  useEffect(() => {
    // Only load milk rate settings if user exists and is an admin
    if (user && user.roleId === UserRole.ADMIN) {
      loadMilkRateSettings();
    }
  }, [user]); // Dependency on user object to ensure it runs when user data is loaded

  const loadMilkRateSettings = async () => {
    // Double-check that only admin users can load milk rate settings
    if (!user || user.roleId !== UserRole.ADMIN) {
      return;
    }
    
    setIsLoadingMilkRates(true);
    try {
      const response = await apiCall(allRoutes.dairy.rates, "get");
      if (response.success && response.data) {
        const data = response.data.data as unknown as MilkRateSettings;
        setMilkRateSettings({
          fatRate: data.fatRate?.toString() || "2.00",
          snfRate: data.snfRate?.toString() || "1.00",
          formulaType: data.formulaType || "fatOnly",
        });
      }
    } catch (error) {
      console.error("Error loading milk rate settings:", error);
      // Load from localStorage as fallback
      const savedSettings = localStorage.getItem("milkRateSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setMilkRateSettings({
          fatRate: settings.fatRate || "2.00",
          snfRate: settings.snfRate || "1.00",
          formulaType: settings.formulaType || "fatOnly",
        });
      }
      toast.error(t("settings.usingLocalSettings"));
    } finally {
      setIsLoadingMilkRates(false);
    }
  };

  const handleSaveMilkRates = async () => {
    // Double-check that only admin users can save milk rate settings
    if (!user || user.roleId !== UserRole.ADMIN) {
      toast.error(t("settings.unauthorized"));
      return;
    }
    
    setIsSavingMilkRates(true);
    try {
      const response = await apiCall(allRoutes.dairy.updateRates, "post", {
        fatRate: parseFloat(milkRateSettings.fatRate),
        snfRate: parseFloat(milkRateSettings.snfRate),
        formulaType: milkRateSettings.formulaType,
      });

      if (response.success) {
        // Save to localStorage for immediate use in other components
        localStorage.setItem(
          "milkRateSettings",
          JSON.stringify({
            fatRate: milkRateSettings.fatRate,
            snfRate: milkRateSettings.snfRate,
            formulaType: milkRateSettings.formulaType,
          })
        );
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
      phone: userData.phone,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
      
    }); 
    if (response.success) {
      toast.success(t("settings.passwordChanged"));
    } else {
      toast.error(t("settings.failedToChangePassword")); 
    }
    setShowPasswordDialog(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
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
    const response = await apiCall(
      allRoutes.farmers.updateFarmer(userData.id),
      "put",
      userData
    );
    if (response.success) {
      toast.success(t("settings.profileUpdated"));
    } else {
      toast.error(t("settings.failedToUpdateProfile"));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("settings.address")}</label>
              <textarea
                value={userData?.address || ""}
                onChange={(e) =>
                  setUserData({ ...userData, address: e.target.value })
                }
                placeholder={t("settings.addressPlaceholder")}
                rows={3}
                className="w-full p-2 border border-border rounded-md bg-background resize-none"
              />
            </div>
            <Button onClick={handleUpdateProfile}>{t("settings.updateProfile")}</Button>
          </CardContent>
        </Card>
        {user?.roleId === UserRole.ADMIN && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Milk className="h-5 w-5 text-primary" />
                {t("settings.milkRateSettings")}
              </CardTitle>
              <CardDescription>
                {t("settings.configureMilkPricing")}
              </CardDescription>
            </CardHeader>{" "}
            <CardContent className="space-y-4">
              {isLoadingMilkRates ? (
                <div className="text-center py-4">
                  {t("settings.loadingMilkRateSettings")}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fatRate">{t("settings.fatRate")} </Label>
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
                    <Label htmlFor="snfRate">{t("settings.snfRate")} </Label>
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
                        <SelectItem value="fatOnly">
                          {t("settings.fatOnly")}{" "}
                          <small className="text-xs text-muted-foreground">
                            {t("settings.fatOnlyDescription")}
                          </small>
                        </SelectItem>
                        <SelectItem value="fatSnf">
                          {t("settings.fatSnf")}{" "}
                          <small className="text-xs text-muted-foreground">
                            {t("settings.fatSnfDescription")}
                          </small>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {milkRateSettings.formulaType === "fatOnly" &&
                        t("settings.fatOnlyFormulaDescription")}
                      {milkRateSettings.formulaType === "fatSnf" &&
                        t("settings.fatSnfFormulaDescription")}
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveMilkRates}
                    disabled={isSavingMilkRates}
                    className="w-full"
                  >
                    {isSavingMilkRates ? t("settings.saving") : t("settings.saveMilkRateSettings")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t("settings.securitySettings")}
            </CardTitle>
            <CardDescription>{t("settings.manageSecuritySettings")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPasswordDialog(true)}
            >
              {t("settings.changePassword")}
            </Button>
            {/* <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowLoginHistoryDialog(true)}
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("settings.loginHistory")}
              </div>
            </Button> */}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when products are running low
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Remind customers about pending payments
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Expiry Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Alert when products are near expiry
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              System Settings
            </CardTitle>
            <CardDescription>Configure system preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Currency</label>
              <select className="w-full p-2 border border-border rounded-md bg-background">
                <option>INR (₹)</option>
                <option>USD ($)</option>
                <option>EUR (€)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Format</label>
              <select className="w-full p-2 border border-border rounded-md bg-background">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card> */}
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.changePassword")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("settings.currentPassword")}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
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
                <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
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
                <Label htmlFor="confirmPassword">{t("settings.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
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
            </div>

            {/* Password Strength Indicator */}
            {passwordData.newPassword && (
              <div className="space-y-2">
                <Label className="text-sm">{t("settings.passwordStrength")}</Label>
                <div className="flex space-x-1">
                  <div
                    className={`h-2 w-full rounded ${
                      passwordData.newPassword.length >= 6
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`h-2 w-full rounded ${
                      passwordData.newPassword.length >= 8 &&
                      /[A-Z]/.test(passwordData.newPassword)
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`h-2 w-full rounded ${
                      passwordData.newPassword.length >= 8 &&
                      /[0-9]/.test(passwordData.newPassword) &&
                      /[!@#$%^&*]/.test(passwordData.newPassword)
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
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

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
              >
                {t("settings.cancel")}
              </Button>
              <Button
                onClick={handlePasswordChange}
                disabled={
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
              >
                {t("settings.changePassword")}
              </Button>
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
