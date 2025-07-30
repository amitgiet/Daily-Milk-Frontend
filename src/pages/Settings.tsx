import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, User, Bell, Database, Shield, Eye, EyeOff, Smartphone, QrCode, Key, History, Monitor, MapPin, Clock } from "lucide-react";

export default function Settings() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showLoginHistoryDialog, setShowLoginHistoryDialog] = useState(false);
  const [showTerminateSessionsDialog, setShowTerminateSessionsDialog] = useState(false);
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
    confirmPassword: ""
  });

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    // Simulate password change
    alert("Password changed successfully!");
    setShowPasswordDialog(false);
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handle2FASetup = () => {
    setShow2FADialog(true);
    setTwoFactorStep(twoFactorEnabled ? 3 : 1); // If already enabled, go to disable step
  };

  const handleEnable2FA = () => {
    if (verificationCode.length !== 6) {
      alert("Please enter a 6-digit verification code");
      return;
    }

    // Simulate 2FA verification
    if (verificationCode === "123456") {
      setTwoFactorEnabled(true);
      alert("Two-Factor Authentication enabled successfully!");
      setShow2FADialog(false);
      setTwoFactorStep(1);
      setVerificationCode("");
    } else {
      alert("Invalid verification code. Please try again.");
    }
  };

  const handleDisable2FA = () => {
    if (verificationCode.length !== 6) {
      alert("Please enter a 6-digit verification code to disable 2FA");
      return;
    }

    // Simulate 2FA verification for disabling
    if (verificationCode === "123456") {
      setTwoFactorEnabled(false);
      alert("Two-Factor Authentication disabled successfully!");
      setShow2FADialog(false);
      setTwoFactorStep(1);
      setVerificationCode("");
    } else {
      alert("Invalid verification code. Please try again.");
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
      status: "Success"
    },
    {
      id: 2,
      date: "2024-07-24",
      time: "06:30 PM",
      device: "Android Phone",
      browser: "Chrome Mobile",
      location: "Mumbai, India",
      ip: "192.168.1.105",
      status: "Success"
    },
    {
      id: 3,
      date: "2024-07-24",
      time: "10:45 AM",
      device: "Windows PC",
      browser: "Chrome 126.0",
      location: "Mumbai, India",
      ip: "192.168.1.100",
      status: "Success"
    },
    {
      id: 4,
      date: "2024-07-23",
      time: "08:20 AM",
      device: "iPad",
      browser: "Safari",
      location: "Pune, India",
      ip: "192.168.2.50",
      status: "Success"
    },
    {
      id: 5,
      date: "2024-07-22",
      time: "11:30 PM",
      device: "Unknown Device",
      browser: "Chrome 125.0",
      location: "Delhi, India",
      ip: "203.192.45.67",
      status: "Failed"
    }
  ];

  const handleExportHistory = () => {
    // Create CSV content
    const headers = ["Date", "Time", "Device", "Browser", "Location", "IP Address", "Status"];
    const csvContent = [
      headers.join(","),
      ...loginHistory.map(login => [
        login.date,
        login.time,
        `"${login.device}"`,
        `"${login.browser}"`,
        `"${login.location}"`,
        login.ip,
        login.status
      ].join(","))
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const fileName = `login-history-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Login history exported successfully as ${fileName}`);
  };

  const handleTerminateAllSessions = () => {
    if (!terminatePassword) {
      alert("Please enter your password to confirm session termination");
      return;
    }

    // Simulate password verification (in real app, this would verify against actual password)
    if (terminatePassword === "admin123") {
      // Simulate terminating all sessions
      alert("All sessions have been terminated successfully! You will need to log in again on all devices.");
      setShowTerminateSessionsDialog(false);
      setShowLoginHistoryDialog(false);
      setTerminatePassword("");
      
      // In a real app, this would redirect to login page or refresh the authentication state
      setTimeout(() => {
        alert("Redirecting to login page...");
      }, 1000);
    } else {
      alert("Invalid password. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your dairy management system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Profile
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                className="w-full p-2 border border-border rounded-md bg-background"
                defaultValue="Admin User"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full p-2 border border-border rounded-md bg-background"
                defaultValue="admin@dairytrack.com"
              />
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment Reminders</p>
                <p className="text-sm text-muted-foreground">Remind customers about pending payments</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Expiry Alerts</p>
                <p className="text-sm text-muted-foreground">Alert when products are near expiry</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => setShowPasswordDialog(true)}>
              Change Password
            </Button>
            <Button variant="outline" className="w-full" onClick={handle2FASetup}>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                {twoFactorEnabled && <span className="text-green-600 text-xs">(Enabled)</span>}
              </div>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowLoginHistoryDialog(true)}>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Login History
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
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
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
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
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
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
                <Label className="text-sm">Password Strength</Label>
                <div className="flex space-x-1">
                  <div className={`h-2 w-full rounded ${passwordData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-2 w-full rounded ${passwordData.newPassword.length >= 8 && /[A-Z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-2 w-full rounded ${passwordData.newPassword.length >= 8 && /[0-9]/.test(passwordData.newPassword) && /[!@#$%^&*]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {passwordData.newPassword.length < 6 ? "Weak" :
                   passwordData.newPassword.length >= 8 && /[A-Z]/.test(passwordData.newPassword) && /[0-9]/.test(passwordData.newPassword) && /[!@#$%^&*]/.test(passwordData.newPassword) ? "Very Strong" :
                   passwordData.newPassword.length >= 8 && /[A-Z]/.test(passwordData.newPassword) ? "Strong" : "Medium"}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordChange} 
                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                Change Password
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
              {twoFactorEnabled ? "Disable Two-Factor Authentication" : "Enable Two-Factor Authentication"}
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
                      <h3 className="font-semibold mb-2">Install Authenticator App</h3>
                      <p className="text-sm text-muted-foreground">
                        Download and install an authenticator app like Google Authenticator, 
                        Microsoft Authenticator, or Authy on your mobile device.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setTwoFactorStep(2)}>
                      Next Step
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
                      <h3 className="font-semibold mb-2">Scan QR Code</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Open your authenticator app and scan this QR code to add your account.
                      </p>
                      <div className="bg-muted p-3 rounded text-sm">
                        <p className="font-medium mb-1">Manual Entry Key:</p>
                        <p className="font-mono text-xs break-all">JBSWY3DPEHPK3PXP</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setTwoFactorStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setTwoFactorStep(3)}>
                      I've Added the Account
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
                      <h3 className="font-semibold mb-2">Enter Verification Code</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code from your authenticator app to complete setup.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="text-center text-lg tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">Use code: 123456 for demo</p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setTwoFactorStep(2)}>
                      Back
                    </Button>
                    <Button onClick={handleEnable2FA} disabled={verificationCode.length !== 6}>
                      Enable 2FA
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
                  <h3 className="font-semibold mb-2 text-red-600">Disable Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to disable 2FA? This will make your account less secure.
                    Enter a verification code from your authenticator app to confirm.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">Use code: 123456 for demo</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDisable2FA} 
                  disabled={verificationCode.length !== 6}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog open={showLoginHistoryDialog} onOpenChange={setShowLoginHistoryDialog}>
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
                        index !== loginHistory.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{login.date}</p>
                        <p className="text-muted-foreground text-xs">{login.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {login.device.includes('Windows') && <Monitor className="h-4 w-4 text-blue-500" />}
                        {login.device.includes('Android') && <Smartphone className="h-4 w-4 text-green-500" />}
                        {login.device.includes('iPad') && <Monitor className="h-4 w-4 text-gray-500" />}
                        {login.device.includes('Unknown') && <Monitor className="h-4 w-4 text-red-500" />}
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
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          login.status === 'Success' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
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
                <li>• If you see suspicious activity, change your password immediately</li>
                <li>• Consider enabling Two-Factor Authentication for extra security</li>
                <li>• Always log out from shared or public computers</li>
              </ul>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing last 5 login attempts
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLoginHistoryDialog(false)}>
                  Close
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowTerminateSessionsDialog(true)}>
                  Terminate All Sessions
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terminate All Sessions Dialog */}
      <Dialog open={showTerminateSessionsDialog} onOpenChange={setShowTerminateSessionsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Terminate All Sessions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-6 bg-red-50 rounded-lg">
                  <Shield className="h-12 w-12 mx-auto text-red-500" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Warning: This action cannot be undone</h3>
                <p className="text-sm text-muted-foreground">
                  This will log you out from all devices and browsers where you're currently signed in, 
                  including this current session. You'll need to log in again on all devices.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">What will happen:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• All active sessions will be immediately terminated</li>
                <li>• You'll be logged out from all devices and browsers</li>
                <li>• Any unsaved work may be lost</li>
                <li>• You'll need to log in again to access your account</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="terminatePassword">Enter your password to confirm</Label>
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
                  onClick={() => setShowTerminatePassword(!showTerminatePassword)}
                >
                  {showTerminatePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use password: admin123 for demo</p>
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