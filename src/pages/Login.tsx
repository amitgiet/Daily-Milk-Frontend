import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Milk, ArrowLeft, CheckCircle, MessageSquare, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { apiCall } from "@/lib/apiCall";
import { allRoutes } from "@/lib/apiRoutes";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [contactAdminLoading, setContactAdminLoading] = useState(false);
  const [contactAdminError, setContactAdminError] = useState("");
  const [contactAdminSuccess, setContactAdminSuccess] = useState(false);

  const loginSchema = z.object({
    phone: z.string().min(10, t('login.phoneError')),
    password: z.string().min(6, t('login.passwordError')),
    rememberMe: z.boolean().optional()
  });

  const forgotPasswordSchema = z.object({
    phone: z.string().min(10, t('login.phoneError'))
  });

  const contactAdminSchema = z.object({
    name: z.string().min(2, t('login.nameError')),
    phone: z.string().min(10, t('login.phoneError')),
    message: z.string().min(10, t('login.messageError'))
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
  type ContactAdminFormData = z.infer<typeof contactAdminSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
      rememberMe: false
    }
  });

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
    reset: resetForgot
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: ""
    }
  });

  const {
    register: registerContact,
    handleSubmit: handleSubmitContact,
    formState: { errors: contactErrors },
    reset: resetContact
  } = useForm<ContactAdminFormData>({
    resolver: zodResolver(contactAdminSchema),
    defaultValues: {
      name: "",
      phone: "",
      message: ""
    }
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError("");

    try {
      const success = await login(data.phone, data.password);
      
      if (success) {
        // Navigate to dashboard on successful login
        navigate("/dashboard");
      } else {
        setLoginError(t('login.invalidCredentials'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('login.loginError');
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);

    try {
      const response = await apiCall(allRoutes.auth.forgotPassword, 'post', { phone: data.phone });
      
      if (response.success) {
        setForgotPasswordSuccess(true);
      } else {
        setForgotPasswordError(t('login.phoneNotFound'));
      }
    } catch (error) {
      setForgotPasswordError(t('login.forgotPasswordError'));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
    resetForgot();
  };

  const handleContactAdmin = async (data: ContactAdminFormData) => {
    setContactAdminLoading(true);
    setContactAdminError("");
    setContactAdminSuccess(false);

    try {
      // TODO: Implement real contact admin API call
      // For now, show success message
      setContactAdminSuccess(true);
    } catch (error) {
      setContactAdminError(t('login.contactError'));
    } finally {
      setContactAdminLoading(false);
    }
  };

  const handleCloseContactAdmin = () => {
    setShowContactAdmin(false);
    setContactAdminError("");
    setContactAdminSuccess(false);
    resetContact();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Milk className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t('login.welcomeBack')}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {t('login.signInDescription')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t('login.phonePlaceholder')}
                    className="pl-10"
                    {...register("phone")}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('login.passwordPlaceholder')}
                    className="pl-10 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="rememberMe" {...register("rememberMe")} />
                <Label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                  {t('auth.rememberMe')}
                </Label>
              </div>
              <Button 
                type="button"
                variant="link" 
                className="text-sm p-0 h-auto text-primary hover:text-primary/80"
                onClick={() => setShowForgotPassword(true)}
              >
                {t('auth.forgotPassword')}
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('login.signingIn')}
                </div>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('login.noAccount')}{" "}
              <Link 
                to="/signup"
                className="text-primary hover:text-primary/80 font-medium"
              >
                {t('signup.createAccount')}
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-2">{t('login.demoCredentials')}:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>{t('auth.phone')}:</strong> 9636044933</p>
              <p><strong>{t('auth.password')}:</strong> 12345678</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        if (!open) handleCloseForgotPassword();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeft 
                className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground" 
                onClick={handleCloseForgotPassword}
              />
              {t('login.resetPassword')}
            </DialogTitle>
          </DialogHeader>

          {forgotPasswordSuccess ? (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-success/10 p-3 rounded-full">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('login.checkEmail')}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('login.resetInstructions')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleCloseForgotPassword}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {t('login.backToLogin')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setForgotPasswordSuccess(false);
                    setForgotPasswordError("");
                  }}
                >
                  {t('login.sendAgain')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitForgot(handleForgotPassword)} className="space-y-6 py-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('login.forgotPasswordDescription')}
                </p>

                {forgotPasswordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{forgotPasswordError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="forgot-phone">{t('auth.phone')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="forgot-phone"
                      type="tel"
                      placeholder={t('login.phonePlaceholder')}
                      className="pl-10"
                      {...registerForgot("phone")}
                    />
                  </div>
                  {forgotErrors.phone && (
                    <p className="text-sm text-destructive">{forgotErrors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('login.sending')}
                    </div>
                  ) : (
                    t('login.sendResetInstructions')
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full"
                  onClick={handleCloseForgotPassword}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
